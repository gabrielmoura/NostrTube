import NDK, { type NDKEvent, NDKZapper, type NDKPaymentConfirmationLN, type NDKUser } from "@nostr-dev-kit/ndk";
import { t } from "i18next";
import { resolveMessageRecipient } from "@/lib/ndk-messages";
import { type StartZapParams, ZapFlowError, type ZapOutcome, type ZapTarget } from "@/features/zap/types/zap";

interface WebLNProvider {
  enable: () => Promise<void>;
  sendPayment: (invoice: string) => Promise<unknown>;
}

declare global {
  interface Window {
    webln?: WebLNProvider;
  }
}

class ZapInvoiceReadyError extends Error {
  invoice: string;

  constructor(invoice: string) {
    super("Lightning invoice generated but payment is pending.");
    this.name = "ZapInvoiceReadyError";
    this.invoice = invoice;
  }
}

function isUserTarget(target: ZapTarget): target is Extract<ZapTarget, { type: "user" }> {
  return target.type === "user";
}

async function resolveZapRecipient(ndk: NDK, target: ZapTarget): Promise<NDKUser | NDKEvent> {
  if (!isUserTarget(target)) {
    return target.event;
  }

  return resolveMessageRecipient(ndk, target.pubkey, target.pubkey).catch((error) => {
    throw new ZapFlowError("recipient-metadata-failed", "Could not resolve recipient metadata for ZAP.", { cause: error });
  });
}

function isPaymentCancelled(message: string) {
  return ["cancel", "canceled", "cancelled", "reject", "denied", "abort"].some((token) => message.includes(token));
}

export function launchLightningInvoice(invoice: string) {
  if (typeof window === "undefined") return;
  window.open(`lightning:${invoice}`, "_blank", "noopener,noreferrer");
}

export function getZapErrorMessage(error: unknown) {
  if (error instanceof ZapFlowError) {
    switch (error.code) {
      case "unauthenticated":
        return t("zap.errors.unauthenticated");
      case "invalid-amount":
        return t("zap.errors.invalid_amount");
      case "recipient-metadata-failed":
        return t("zap.errors.recipient_metadata_failed");
      case "zap-unavailable":
        return t("zap.errors.zap_unavailable");
      case "zap-invoice-failed":
        return t("zap.errors.zap_invoice_failed");
      case "zap-payment-cancelled":
        return t("zap.errors.zap_payment_cancelled");
      case "zap-payment-failed":
        return t("zap.errors.zap_payment_failed");
      default:
        return error.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return t("zap.errors.unknown");
}

export async function startZap({ ndk, target, amountSats, comment }: StartZapParams): Promise<ZapOutcome> {
  if (!Number.isInteger(amountSats) || amountSats <= 0) {
    throw new ZapFlowError("invalid-amount", "Invalid zap amount.");
  }

  const recipient = await resolveZapRecipient(ndk, target);
  const captured = { invoice: "" };

  const zapper = new NDKZapper(recipient, amountSats * 1000, "msat", {
    comment,
    ndk,
    lnPay: async ({ pr }): Promise<NDKPaymentConfirmationLN | undefined> => {
      captured.invoice = pr;

      if (typeof window !== "undefined" && window.webln) {
        try {
          await window.webln.enable();
          const result = await window.webln.sendPayment(pr) as { preimage?: string } | undefined;
          return { preimage: result?.preimage || t("zap.success.webln_preimage_fallback") };
        } catch (error) {
          const message = error instanceof Error ? error.message.toLowerCase() : "";
          if (isPaymentCancelled(message)) {
            throw new ZapFlowError("zap-payment-cancelled", "The Lightning payment was cancelled.", { cause: error instanceof Error ? error : undefined });
          }

          throw new ZapFlowError("zap-payment-failed", "The Lightning payment failed.", { cause: error instanceof Error ? error : undefined });
        }
      }

      launchLightningInvoice(pr);
      throw new ZapInvoiceReadyError(pr);
    }
  });

  zapper.on("ln_invoice", ({ pr }) => {
    captured.invoice = pr;
  });

  try {
    await zapper.zap(["nip57"]);

    if (!captured.invoice) {
      throw new ZapFlowError("zap-invoice-failed", "Lightning invoice missing from ZAP flow.");
    }

    return {
      status: "paid",
      invoice: captured.invoice
    };
  } catch (error) {
    if (error instanceof ZapInvoiceReadyError) {
      return {
        status: "invoice-ready",
        invoice: error.invoice
      };
    }

    const message = error instanceof Error ? error.message.toLowerCase() : "";

    if (message.includes("no zap method") || message.includes("no zap endpoint") || message.includes("no zap spec")) {
      throw new ZapFlowError("zap-unavailable", "This recipient does not have a valid Lightning address for ZAP.", { cause: error instanceof Error ? error : undefined });
    }

    if (message.includes("invoice") || message.includes("lnurl") || message.includes("payment request")) {
      throw new ZapFlowError("zap-invoice-failed", "Could not generate the Lightning invoice.", { cause: error instanceof Error ? error : undefined });
    }

    if (error instanceof ZapFlowError) {
      throw error;
    }

    throw new ZapFlowError("zap-payment-failed", "The Lightning payment failed.", { cause: error instanceof Error ? error : undefined });
  }
}
