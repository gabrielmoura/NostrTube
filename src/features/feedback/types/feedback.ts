import { z } from "zod";
import {
  FEEDBACK_CATEGORIES,
  FEEDBACK_ZAP_PRESETS,
  type FeedbackCategoryValue,
  type FeedbackZapPresetValue
} from "@/features/feedback/constants/feedbackCategories";
import { FEEDBACK_MAX_CUSTOM_ZAP_SATS } from "@/config/feedback.const";

const feedbackCategoryValues = FEEDBACK_CATEGORIES.map((category) => category.value) as [FeedbackCategoryValue, ...FeedbackCategoryValue[]];

export const feedbackFormSchema = z.object({
  title: z.string().trim().min(5, "Informe um titulo com pelo menos 5 caracteres.").max(120, "Use no maximo 120 caracteres no titulo."),
  category: z.enum(feedbackCategoryValues, { message: "Selecione uma categoria." }),
  name: z.string().trim().max(80, "Use no maximo 80 caracteres no nome.").optional().or(z.literal("")),
  email: z.email("Informe um e-mail valido.").max(160, "Use no maximo 160 caracteres no e-mail.").optional().or(z.literal("")),
  message: z.string().trim().min(20, "Descreva sua mensagem com pelo menos 20 caracteres.").max(3000, "Use no maximo 3000 caracteres na mensagem."),
  zapPreset: z.enum(FEEDBACK_ZAP_PRESETS),
  customZapAmount: z.string().trim(),
  zapNote: z.string().trim().max(240, "Use no maximo 240 caracteres na nota do ZAP.").optional().or(z.literal("")),
  includeTechnicalDetails: z.boolean().default(false)
}).superRefine((data, ctx) => {
  if (data.zapPreset !== "custom") return;

  if (!data.customZapAmount) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Informe um valor de ZAP em sats.",
      path: ["customZapAmount"]
    });
    return;
  }

  const amount = Number(data.customZapAmount);

  if (!Number.isInteger(amount) || amount <= 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Use apenas inteiros positivos em sats.",
      path: ["customZapAmount"]
    });
  }

  if (amount > FEEDBACK_MAX_CUSTOM_ZAP_SATS) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Use no maximo ${FEEDBACK_MAX_CUSTOM_ZAP_SATS.toLocaleString()} sats.`,
      path: ["customZapAmount"]
    });
  }
});

export type FeedbackFormValues = z.infer<typeof feedbackFormSchema>;

export interface FeedbackTechnicalDetails {
  url: string;
  userAgent: string;
  appVersion: string;
  locale: string;
  timestamp: string;
}

export interface PowProgressSnapshot {
  attempts: number;
  updatedAt: number;
}

export type FeedbackSubmissionStage = "idle" | "preparing" | "pow" | "signing" | "publishing" | "zap" | "success" | "error" | "cancelled";

export type FeedbackErrorCode =
  | "unauthenticated"
  | "invalid-recipient"
  | "pow-failed"
  | "pow-cancelled"
  | "sign-failed"
  | "publish-failed"
  | "publish-timeout"
  | "relay-unavailable"
  | "recipient-metadata-failed"
  | "zap-unavailable"
  | "zap-invoice-failed"
  | "zap-payment-failed"
  | "unknown";

export class FeedbackFlowError extends Error {
  code: FeedbackErrorCode;

  constructor(code: FeedbackErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "FeedbackFlowError";
    this.code = code;
  }
}

export interface FeedbackSuccessState {
  feedbackId: string;
  messageId: string;
  protocol: "nip17";
  zapStatus: "not-requested" | "paid" | "invoice-ready" | "failed";
  zapMessage?: string;
  zapInvoice?: string;
}

export function resolveFeedbackZapAmount(values: Pick<FeedbackFormValues, "zapPreset" | "customZapAmount">): number | undefined {
  if (values.zapPreset === "none") return undefined;
  if (values.zapPreset === "custom") {
    const amount = Number(values.customZapAmount);
    return Number.isInteger(amount) && amount > 0 ? amount : undefined;
  }

  const amount = Number(values.zapPreset satisfies FeedbackZapPresetValue);
  return Number.isInteger(amount) && amount > 0 ? amount : undefined;
}
