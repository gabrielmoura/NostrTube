import type { VideoVariant } from "@/features/video/services/video-imeta.service";
import { getDimensionLabel } from "@/features/video/services/video-imeta.service";
import { cn } from "@/helper/format";

interface VideoVariantSelectorProps {
  variants: VideoVariant[];
  value: string;
  unavailableVariantIds: Set<string>;
  onChange: (variantId: string) => void;
}

export function VideoVariantSelector({
  variants,
  value,
  unavailableVariantIds,
  onChange
}: VideoVariantSelectorProps) {
  if (variants.length <= 1) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 pb-3 pt-1">
      <span className="text-sm font-medium text-muted-foreground">Qualidade</span>
      {variants.map((variant) => {
        const unavailable = unavailableVariantIds.has(variant.id);
        const active = value === variant.id;

        return (
          <button
            key={variant.id}
            type="button"
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              active && "border-primary bg-primary text-primary-foreground",
              !active && "border-border bg-background text-foreground hover:bg-muted",
              unavailable && "cursor-not-allowed opacity-50"
            )}
            disabled={unavailable}
            onClick={() => onChange(variant.id)}
          >
            {getDimensionLabel(variant)}
          </button>
        );
      })}
    </div>
  );
}
