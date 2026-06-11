import { Input } from "@/components/ui/input";
import { t } from "i18next";
import { cn } from "@/lib/utils";
import { FEEDBACK_ZAP_PRESETS, type FeedbackZapPresetValue } from "@/features/feedback/constants/feedbackCategories";

const presetKeys: Record<FeedbackZapPresetValue, string> = {
  none: "feedback.zap.none",
  "21": "feedback.zap.21",
  "100": "feedback.zap.100",
  "500": "feedback.zap.500",
  "1000": "feedback.zap.1000",
  "5000": "feedback.zap.5000",
  custom: "feedback.zap.custom"
};

interface FeedbackZapAmountSelectProps {
  preset: FeedbackZapPresetValue;
  customAmount: string;
  onPresetChange: (value: FeedbackZapPresetValue) => void;
  onCustomAmountChange: (value: string) => void;
  disabled?: boolean;
  errorMessage?: string;
}

export function FeedbackZapAmountSelect({
  preset,
  customAmount,
  onPresetChange,
  onCustomAmountChange,
  disabled = false,
  errorMessage
}: FeedbackZapAmountSelectProps) {
  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-describedby={errorMessage ? "feedback-zap-error" : undefined} className="grid gap-2 sm:grid-cols-2">
        {FEEDBACK_ZAP_PRESETS.map((option) => {
          const checked = option === preset;

          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={checked}
              disabled={disabled}
              onClick={() => onPresetChange(option)}
              className={cn(
                "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                checked ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                disabled && "cursor-not-allowed opacity-60"
              )}
            >
              {t(presetKeys[option])}
            </button>
          );
        })}
      </div>

      {preset === "custom" ? (
        <div className="relative">
          <Input
            inputMode="numeric"
            pattern="[0-9]*"
            value={customAmount}
            disabled={disabled}
            onChange={(event) => onCustomAmountChange(event.target.value.replace(/[^0-9]/g, ""))}
            className="pr-14"
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={errorMessage ? "feedback-zap-error" : undefined}
            placeholder={t("feedback.zap.custom_placeholder")}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{t("feedback.zap.unit")}</span>
        </div>
      ) : null}

      {errorMessage ? <p id="feedback-zap-error" className="text-sm text-destructive">{errorMessage}</p> : null}
    </div>
  );
}
