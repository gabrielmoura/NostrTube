import { t } from "i18next";
import { FEEDBACK_SOURCE_TAG } from "@/config/feedback.constants";
import type { FeedbackCategoryDefinition } from "@/features/feedback/constants/feedbackCategories";
import type { FeedbackTechnicalDetails } from "@/features/feedback/types/feedback";

interface BuildFeedbackEventParams {
  feedbackId: string;
  recipientPubkey: string;
  title: string;
  message: string;
  category: FeedbackCategoryDefinition;
  browserLanguage?: string;
  zapAmount?: number;
  technicalDetails?: FeedbackTechnicalDetails;
}

export function buildFeedbackContent({ feedbackId, title, message, category, browserLanguage, zapAmount, technicalDetails }: BuildFeedbackEventParams) {
  const lines = [
    `${t("feedback.event.feedback_id_label")}: ${feedbackId}`,
    `${t("feedback.event.title_label")}: ${title.trim()}`,
    `${t("feedback.event.category_label")}: ${t(category.labelKey)}`,
    browserLanguage ? `${t("feedback.event.browser_language_label")}: ${browserLanguage}` : "",
    zapAmount ? `${t("feedback.event.zap_label")}: ${zapAmount} sats` : "",
    "",
    message.trim()
  ].filter(Boolean);

  if (technicalDetails) {
    lines.push(
      "",
      "---",
      `${t("feedback.event.technical_details_label")}:`,
      `URL: ${technicalDetails.url}`,
      `${t("feedback.event.locale_label")}: ${technicalDetails.locale}`,
      `${t("feedback.event.app_version_label")}: ${technicalDetails.appVersion}`,
      `User agent: ${technicalDetails.userAgent}`,
      `${t("feedback.event.timestamp_label")}: ${technicalDetails.timestamp}`
    );
  }

  return lines.join("\n");
}

export function buildFeedbackRumorTags({ feedbackId, recipientPubkey, title, category, browserLanguage, zapAmount }: Omit<BuildFeedbackEventParams, "message" | "technicalDetails">) {
  const appName = import.meta.env.VITE_APP_NAME || "NostrTube";

  return [
    ["p", recipientPubkey],
    ["d", feedbackId],
    ["t", "feedback"],
    ["t", category.value],
    ["subject", title.trim()],
    ["client", appName],
    ["source", FEEDBACK_SOURCE_TAG],
    ["category", category.value],
    ...(browserLanguage ? [["lang", browserLanguage]] : []),
    ...(zapAmount ? [["zap", String(zapAmount)]] : [])
  ];
}

export function getBrowserLanguage(): string | undefined {
  if (typeof window === "undefined") return undefined;
  return window.navigator.language || undefined;
}

export function collectFeedbackTechnicalDetails(): FeedbackTechnicalDetails | undefined {
  if (typeof window === "undefined") return undefined;

  const rawUserAgent = window.navigator.userAgent || "unknown";

  return {
    url: window.location.href,
    locale: window.navigator.language || "unknown",
    appVersion: import.meta.env.VITE_APP_VERSION || "unknown",
    userAgent: rawUserAgent.length > 200 ? `${rawUserAgent.slice(0, 197)}...` : rawUserAgent,
    timestamp: new Date().toISOString()
  };
}
