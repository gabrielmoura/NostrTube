import { useEffect } from "react";
import { t } from "i18next";
import { type Resolver, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FEEDBACK_DRAFT_STORAGE_KEY } from "@/config/feedback.const";
import { getFeedbackCategory } from "@/features/feedback/constants/feedbackCategories";
import { type FeedbackFormValues, feedbackFormSchema, resolveFeedbackZapAmount } from "@/features/feedback/types/feedback";

const defaultValues: FeedbackFormValues = {
  title: "",
  category: "feature-request",
  name: "",
  email: "",
  message: "",
  zapPreset: "none",
  customZapAmount: "",
  zapNote: "",
  includeTechnicalDetails: false
};

function loadFeedbackDraft(): FeedbackFormValues {
  if (typeof window === "undefined") return defaultValues;

  try {
    const rawDraft = window.localStorage.getItem(FEEDBACK_DRAFT_STORAGE_KEY);
    if (!rawDraft) return defaultValues;

    const parsed = JSON.parse(rawDraft);
    const result = feedbackFormSchema.safeParse(parsed);
    return result.success ? result.data : defaultValues;
  } catch {
    return defaultValues;
  }
}

export function useFeedbackForm() {
  const form = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema) as Resolver<FeedbackFormValues>,
    defaultValues: loadFeedbackDraft(),
    mode: "onChange"
  });

  const values = form.watch();
  const selectedCategory = getFeedbackCategory(values.category);
  const zapAmount = resolveFeedbackZapAmount(values);
  const messagePlaceholder = selectedCategory
    ? t(selectedCategory.placeholderKey)
    : t("feedback.message_placeholder_default");

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(FEEDBACK_DRAFT_STORAGE_KEY, JSON.stringify(values));
  }, [values]);

  return {
    form,
    values,
    zapAmount,
    selectedCategory,
    messagePlaceholder,
    isBugCategory: values.category === "bug-report",
    clearDraft: () => {
      if (typeof window === "undefined") return;
      window.localStorage.removeItem(FEEDBACK_DRAFT_STORAGE_KEY);
    },
    resetToDefaults: () => form.reset(defaultValues)
  };
}
