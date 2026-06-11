import { t } from "i18next";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const DEFAULT_PRESETS = [21, 100, 500, 1000, 5000] as const;

interface ZapAmountSelectorProps {
  amount: string;
  onAmountChange: (value: string) => void;
  disabled?: boolean;
  errorMessage?: string;
  presets?: readonly number[];
}

export function ZapAmountSelector({
  amount,
  onAmountChange,
  disabled = false,
  errorMessage,
  presets = DEFAULT_PRESETS
}: ZapAmountSelectorProps) {
  const customSelected = amount.length > 0 && !presets.some((preset) => String(preset) === amount);

  return (
    <div className="space-y-3">
      <div role="radiogroup" aria-describedby={errorMessage ? "zap-amount-error" : undefined} className="grid gap-2 sm:grid-cols-3">
        {presets.map((preset) => {
          const checked = amount === String(preset);

          return (
            <button
              key={preset}
              type="button"
              role="radio"
              aria-checked={checked}
              disabled={disabled}
              onClick={() => onAmountChange(String(preset))}
              className={cn(
                "rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                checked ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground",
                disabled && "cursor-not-allowed opacity-60"
              )}
            >
              {preset} sats
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="zap-custom-amount">
          {t("zap.fields.custom_amount")}
        </label>
        <div className="relative">
          <Input
            id="zap-custom-amount"
            inputMode="numeric"
            pattern="[0-9]*"
            value={customSelected ? amount : ""}
            disabled={disabled}
            onChange={(event) => onAmountChange(event.target.value.replace(/[^0-9]/g, ""))}
            className="pr-14"
            aria-invalid={Boolean(errorMessage)}
            aria-describedby={errorMessage ? "zap-amount-error" : undefined}
            placeholder={t("zap.fields.custom_amount_placeholder")}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{t("zap.fields.sats_unit")}</span>
        </div>
      </div>

      {errorMessage ? <p id="zap-amount-error" className="text-sm text-destructive">{errorMessage}</p> : null}
    </div>
  );
}
