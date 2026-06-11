import { useCallback, useMemo, useRef, useState } from "react";
import { t } from "i18next";
import { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk";
import { useNDK, useNDKCurrentPubkey } from "@nostr-dev-kit/ndk-hooks";
import { toast } from "sonner";
import { ulid } from "ulid";
import { FEEDBACK_POW_DIFFICULTY, FEEDBACK_PUBLISH_TIMEOUT_MS } from "@/config/feedback.constants";
import { getFeedbackRecipientConfig } from "@/config/feedback";
import { getFeedbackCategory } from "@/features/feedback/constants/feedbackCategories";
import { buildFeedbackContent, buildFeedbackRumorTags, collectFeedbackTechnicalDetails, getBrowserLanguage } from "@/features/feedback/services/feedbackEventService";
import { startFeedbackZap } from "@/features/feedback/services/feedbackZapService";
import { sendPrivateMessageEvent } from "@/lib/ndk-messages";
import { mineEventWithPow } from "@/features/feedback/services/powService";
import { nostrNow } from "@/helper/date";
import {
  type FeedbackFormValues,
  type FeedbackSubmissionStage,
  type FeedbackSuccessState,
  type PowProgressSnapshot,
  FeedbackFlowError,
  resolveFeedbackZapAmount
} from "@/features/feedback/types/feedback";

async function sendMessageWithTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => {
        reject(new FeedbackFlowError("publish-timeout", "Publishing timed out."));
      }, timeoutMs);
    })
  ]);
}

function mapFriendlyError(error: unknown) {
  if (error instanceof FeedbackFlowError) {
    switch (error.code) {
      case "unauthenticated":
        return t("feedback.errors.unauthenticated");
      case "invalid-recipient":
        return t("feedback.errors.invalid_recipient");
      case "pow-cancelled":
        return t("feedback.errors.pow_cancelled");
      case "pow-failed":
        return t("feedback.errors.pow_failed");
      case "sign-failed":
        return t("feedback.errors.sign_failed");
      case "publish-timeout":
        return t("feedback.errors.publish_timeout");
      case "publish-failed":
        return t("feedback.errors.publish_failed");
      case "relay-unavailable":
        return t("feedback.errors.relay_unavailable");
      case "recipient-metadata-failed":
        return t("feedback.errors.recipient_metadata_failed");
      case "zap-unavailable":
        return t("feedback.errors.zap_unavailable");
      case "zap-invoice-failed":
        return t("feedback.errors.zap_invoice_failed");
      case "zap-payment-failed":
        return t("feedback.errors.zap_payment_failed");
      default:
        return error.message;
    }
  }

  if (error instanceof Error) return error.message;
  return t("feedback.errors.unknown");
}

export function useSubmitFeedback() {
  const { ndk } = useNDK();
  const currentPubkey = useNDKCurrentPubkey();
  const abortControllerRef = useRef<AbortController | null>(null);
  const [stage, setStage] = useState<FeedbackSubmissionStage>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [powProgress, setPowProgress] = useState<PowProgressSnapshot | null>(null);
  const [successState, setSuccessState] = useState<FeedbackSuccessState | null>(null);

  const resetState = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setStage("idle");
    setErrorMessage(null);
    setPowProgress(null);
    setSuccessState(null);
  }, []);

  const cancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const submit = useCallback(async (values: FeedbackFormValues) => {
    let messageId: string | null = null;
    const feedbackId = ulid();

    try {
      setErrorMessage(null);
      setSuccessState(null);
      setPowProgress(null);

      if (!ndk || !currentPubkey) {
        throw new FeedbackFlowError("unauthenticated", "User must be logged in before sending feedback.");
      }

      if (!ndk.pool?.relays?.size) {
        throw new FeedbackFlowError("relay-unavailable", "No relay available to publish feedback.");
      }

      const category = getFeedbackCategory(values.category);
      if (!category) {
        throw new FeedbackFlowError("unknown", "Invalid feedback category.");
      }

      let recipientConfig;
      try {
        recipientConfig = getFeedbackRecipientConfig();
      } catch (error) {
        throw new FeedbackFlowError("invalid-recipient", "Invalid feedback recipient configuration.", { cause: error });
      }

      setStage("preparing");

      const browserLanguage = getBrowserLanguage();
      const technicalDetails = collectFeedbackTechnicalDetails();
      const zapAmount = resolveFeedbackZapAmount(values);

      const content = buildFeedbackContent({
        feedbackId,
        recipientPubkey: recipientConfig.pubkey,
        title: values.title,
        message: values.message,
        category,
        browserLanguage,
        zapAmount,
        technicalDetails
      });

      const tags = buildFeedbackRumorTags({
        feedbackId,
        recipientPubkey: recipientConfig.pubkey,
        title: values.title,
        category,
        browserLanguage,
        zapAmount
      });

      const rumorBaseEvent = {
        kind: NDKKind.PrivateDirectMessage,
        pubkey: currentPubkey,
        created_at: nostrNow(),
        content,
        tags
      };

      abortControllerRef.current = new AbortController();

      setStage("pow");

      const minedRumor = await mineEventWithPow(rumorBaseEvent, FEEDBACK_POW_DIFFICULTY, {
        signal: abortControllerRef.current.signal,
        onProgress: (attempts: number) => {
          setPowProgress({ attempts, updatedAt: Date.now() });
        }
      });

      const rumorEvent = new NDKEvent(ndk, minedRumor);

      setStage("publishing");

      try {
        const { wrappedEvent } = await sendMessageWithTimeout(
          sendPrivateMessageEvent(ndk, recipientConfig.npub, rumorEvent, recipientConfig.pubkey),
          FEEDBACK_PUBLISH_TIMEOUT_MS
        );
        messageId = wrappedEvent.id;
      } catch (error) {
        if (error instanceof FeedbackFlowError) throw error;
        throw new FeedbackFlowError("publish-failed", "Failed to publish private feedback message.", { cause: error });
      }

      if (!zapAmount) {
        const success: FeedbackSuccessState = {
          feedbackId,
          messageId: messageId || crypto.randomUUID(),
          protocol: "nip17",
          zapStatus: "not-requested"
        };
        setSuccessState(success);
        setStage("success");
        toast.success(t("feedback.success.sent"));
        return success;
      }

      setStage("zap");

      try {
        const zapOutcome = await startFeedbackZap({
          ndk,
          recipientNpub: recipientConfig.npub,
          recipientPubkey: recipientConfig.pubkey,
          amountSats: zapAmount,
          comment: values.title.trim()
        });

        const success: FeedbackSuccessState = {
          feedbackId,
          messageId: messageId || crypto.randomUUID(),
          protocol: "nip17",
          zapStatus: zapOutcome.status,
          zapInvoice: zapOutcome.invoice,
          zapMessage: zapOutcome.status === "paid"
            ? t("feedback.success.sent_with_zap")
            : t("feedback.success.invoice_ready")
        };

        setSuccessState(success);
        setStage("success");
        toast.success(success.zapMessage || "Feedback enviado com sucesso.");
        return success;
      } catch {
        const success: FeedbackSuccessState = {
          feedbackId,
          messageId: messageId || crypto.randomUUID(),
          protocol: "nip17",
          zapStatus: "failed",
          zapMessage: t("feedback.success.zap_failed_after_feedback")
        };
        setSuccessState(success);
        setStage("success");
        toast.warning(success.zapMessage);
        return success;
      }
    } catch (error) {
      const friendlyMessage = mapFriendlyError(error);
      setErrorMessage(friendlyMessage);
      setStage(error instanceof FeedbackFlowError && error.code === "pow-cancelled" ? "cancelled" : "error");

      if (!messageId) {
        toast.error(friendlyMessage);
      }

      return null;
    } finally {
      abortControllerRef.current = null;
    }
  }, [currentPubkey, ndk]);

  const isSubmitting = useMemo(() => ["preparing", "pow", "publishing", "zap"].includes(stage), [stage]);

  return {
    submit,
    cancel,
    resetState,
    stage,
    errorMessage,
    powProgress,
    successState,
    isSubmitting
  };
}
