import { useState } from "react";
import { t } from "i18next";
import { BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VideoMetricsZapModal } from "@/features/video/components/VideoMetricsZapModal";
import type { NDKEvent } from "@nostr-dev-kit/ndk";

export function VideoMetricsZapButton({ event }: { event: NDKEvent }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="secondary" size="sm" className="gap-2" onClick={() => setOpen(true)}>
        <BarChart3 className="size-4" />
        <span>{t("video_metrics.open_button")}</span>
      </Button>
      <VideoMetricsZapModal open={open} onOpenChange={setOpen} event={event} />
    </>
  );
}
