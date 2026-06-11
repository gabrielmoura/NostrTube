export const FEEDBACK_CATEGORIES = [
  {
    value: "feature-request",
    labelKey: "feedback.categories.feature-request.label",
    descriptionKey: "feedback.categories.feature-request.description",
    placeholderKey: "feedback.categories.feature-request.placeholder",
    icon: "lightbulb"
  },
  {
    value: "bug-report",
    labelKey: "feedback.categories.bug-report.label",
    descriptionKey: "feedback.categories.bug-report.description",
    placeholderKey: "feedback.categories.bug-report.placeholder",
    icon: "bug"
  },
  {
    value: "thanks",
    labelKey: "feedback.categories.thanks.label",
    descriptionKey: "feedback.categories.thanks.description",
    placeholderKey: "feedback.categories.thanks.placeholder",
    icon: "heart"
  },
  {
    value: "ui-ux",
    labelKey: "feedback.categories.ui-ux.label",
    descriptionKey: "feedback.categories.ui-ux.description",
    placeholderKey: "feedback.categories.ui-ux.placeholder",
    icon: "layout"
  },
  {
    value: "performance",
    labelKey: "feedback.categories.performance.label",
    descriptionKey: "feedback.categories.performance.description",
    placeholderKey: "feedback.categories.performance.placeholder",
    icon: "gauge"
  },
  {
    value: "video-player",
    labelKey: "feedback.categories.video-player.label",
    descriptionKey: "feedback.categories.video-player.description",
    placeholderKey: "feedback.categories.video-player.placeholder",
    icon: "play"
  },
  {
    value: "upload-blossom",
    labelKey: "feedback.categories.upload-blossom.label",
    descriptionKey: "feedback.categories.upload-blossom.description",
    placeholderKey: "feedback.categories.upload-blossom.placeholder",
    icon: "upload"
  },
  {
    value: "search-discovery",
    labelKey: "feedback.categories.search-discovery.label",
    descriptionKey: "feedback.categories.search-discovery.description",
    placeholderKey: "feedback.categories.search-discovery.placeholder",
    icon: "search"
  },
  {
    value: "feeds-recommendations",
    labelKey: "feedback.categories.feeds-recommendations.label",
    descriptionKey: "feedback.categories.feeds-recommendations.description",
    placeholderKey: "feedback.categories.feeds-recommendations.placeholder",
    icon: "sparkles"
  },
  {
    value: "login-nostr",
    labelKey: "feedback.categories.login-nostr.label",
    descriptionKey: "feedback.categories.login-nostr.description",
    placeholderKey: "feedback.categories.login-nostr.placeholder",
    icon: "key"
  },
  {
    value: "moderation-content",
    labelKey: "feedback.categories.moderation-content.label",
    descriptionKey: "feedback.categories.moderation-content.description",
    placeholderKey: "feedback.categories.moderation-content.placeholder",
    icon: "shield"
  },
  {
    value: "privacy-security",
    labelKey: "feedback.categories.privacy-security.label",
    descriptionKey: "feedback.categories.privacy-security.description",
    placeholderKey: "feedback.categories.privacy-security.placeholder",
    icon: "lock"
  },
  {
    value: "i18n",
    labelKey: "feedback.categories.i18n.label",
    descriptionKey: "feedback.categories.i18n.description",
    placeholderKey: "feedback.categories.i18n.placeholder",
    icon: "languages"
  },
  {
    value: "documentation",
    labelKey: "feedback.categories.documentation.label",
    descriptionKey: "feedback.categories.documentation.description",
    placeholderKey: "feedback.categories.documentation.placeholder",
    icon: "book"
  },
  {
    value: "other",
    labelKey: "feedback.categories.other.label",
    descriptionKey: "feedback.categories.other.description",
    placeholderKey: "feedback.categories.other.placeholder",
    icon: "message"
  }
] as const;

export const FEEDBACK_ZAP_PRESETS = ["none", "21", "100", "500", "1000", "5000", "custom"] as const;

export type FeedbackCategoryValue = typeof FEEDBACK_CATEGORIES[number]["value"];
export type FeedbackCategoryDefinition = typeof FEEDBACK_CATEGORIES[number];
export type FeedbackZapPresetValue = typeof FEEDBACK_ZAP_PRESETS[number];

export function getFeedbackCategory(value: string): FeedbackCategoryDefinition | undefined {
  return FEEDBACK_CATEGORIES.find((category) => category.value === value);
}
