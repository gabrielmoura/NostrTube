import { useMemo, useState } from "react";
import { t } from "i18next";
import { useNDK, useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { BarChart3, MessageSquareText, PlayCircle, Wallet } from "lucide-react";
import { formatCount } from "@/helper/format";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthModal } from "@/components/AuthModal";
import { modal } from "@/components/modal_v2/modal-manager";
import { useMediaQuery } from "@/components/modal_v2/use-media-query";
import { ZapAmountSelector } from "@/features/zap/components/ZapAmountSelector";
import { useZapSubmission } from "@/features/zap/hooks/useZapSubmission";
import { launchLightningInvoice } from "@/features/zap/services/zap.service";
import { useVideoMetrics } from "@/features/video/hooks/useVideoMetrics";
import type { NDKEvent } from "@nostr-dev-kit/ndk";

interface VideoMetricsZapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: NDKEvent;
}

function formatMetricValue(value: number | null, suffix?: string) {
  if (value === null) {
    return "--";
  }

  const formatted = String(formatCount(value));
  return suffix ? `${formatted} ${suffix}` : formatted;
}

function MetricCard({ icon: Icon, label, value, isLoading }: { icon: typeof Wallet; label: string; value: string; isLoading: boolean }) {
  return (
    <div className="rounded-2xl border bg-card p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="size-4" />
        <span>{label}</span>
      </div>
      <div className="mt-3 text-xl font-semibold text-foreground">
        {isLoading ? <Skeleton className="h-6 w-20" /> : value}
      </div>
    </div>
  );
}

export function VideoMetricsZapModal({ open, onOpenChange, event }: VideoMetricsZapModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const { ndk } = useNDK();
  const currentUser = useNDKCurrentUser();
  const metrics = useVideoMetrics({ ndk: ndk ?? undefined, event, enabled: open });
  const submission = useZapSubmission();
  const [amount, setAmount] = useState("100");
  const [comment, setComment] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);

  const cards = useMemo(() => ([
    {
      key: "views",
      icon: PlayCircle,
      label: t("video_metrics.cards.views"),
      value: formatMetricValue(metrics.data?.views ?? null)
    },
    {
      key: "comments",
      icon: MessageSquareText,
      label: t("video_metrics.cards.comments"),
      value: formatMetricValue(metrics.data?.comments ?? null)
    },
    {
      key: "zapCount",
      icon: BarChart3,
      label: t("video_metrics.cards.zap_count"),
      value: formatMetricValue(metrics.data?.zapCount ?? null)
    },
    {
      key: "zapTotalSats",
      icon: Wallet,
      label: t("video_metrics.cards.zap_total"),
      value: formatMetricValue(metrics.data?.zapTotalSats ?? null, "sats")
    }
  ]), [metrics.data]);

  const handleSubmitZap = async () => {
    const parsedAmount = Number.parseInt(amount, 10);
    if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
      setAmountError(t("zap.errors.invalid_amount"));
      return;
    }

    setAmountError(null);
    const result = await submission.submit({
      target: {
        type: "event",
        event
      },
      amountSats: parsedAmount,
      comment: comment.trim() || undefined
    });

    if (result?.status === "paid") {
      onOpenChange(false);
    }
  };

  const content = (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card) => (
          <MetricCard key={card.key} icon={card.icon} label={card.label} value={card.value} isLoading={metrics.isLoading} />
        ))}
      </div>

      {metrics.error ? (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-muted-foreground">
          {t("video_metrics.partial_error")}
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label>{t("video_metrics.support.title")}</Label>
          {metrics.isFetching && !metrics.isLoading ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => void metrics.refetch()}>
              {t("video_metrics.support.refreshing")}
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={() => void metrics.refetch()}>
              {t("video_metrics.support.refresh")}
            </Button>
          )}
        </div>
        <ZapAmountSelector amount={amount} onAmountChange={setAmount} disabled={submission.isSubmitting} errorMessage={amountError || undefined} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="video-zap-note">{t("zap.fields.note")}</Label>
        <Input
          id="video-zap-note"
          value={comment}
          maxLength={240}
          disabled={submission.isSubmitting}
          onChange={(eventValue) => setComment(eventValue.target.value)}
          placeholder={t("zap.fields.note_placeholder")}
        />
      </div>

      {!currentUser ? (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">
          <p className="text-foreground">{t("zap.auth_required.description")}</p>
          <Button type="button" variant="outline" className="mt-3" onClick={() => modal.show(<AuthModal />, { id: "auth" })}>
            {t("zap.auth_required.action")}
          </Button>
        </div>
      ) : null}

      {submission.status === "invoice-ready" && submission.invoice ? (
        <div className="rounded-2xl border bg-card p-4 text-sm">
          <p className="font-medium text-foreground">{t("zap.success.invoice_ready")}</p>
          <p className="mt-2 text-muted-foreground">{t("zap.success.invoice_description")}</p>
          <Button type="button" className="mt-3" onClick={() => launchLightningInvoice(submission.invoice!)}>
            {t("zap.success.open_wallet")}
          </Button>
        </div>
      ) : null}

      {submission.errorMessage ? (
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-foreground">
          {submission.errorMessage}
        </div>
      ) : null}
    </div>
  );

  const footer = (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submission.isSubmitting}>
        {t("zap.actions.close")}
      </Button>
      <Button type="button" onClick={handleSubmitZap} isLoading={submission.isSubmitting} disabled={!currentUser}>
        {t("video_metrics.support.submit")}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("video_metrics.modal_title")}</DialogTitle>
            <DialogDescription>{t("video_metrics.modal_description")}</DialogDescription>
          </DialogHeader>
          {content}
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="px-4 pb-6">
        <DrawerHeader className="px-0 pt-2">
          <DrawerTitle>{t("video_metrics.modal_title")}</DrawerTitle>
          <DrawerDescription>{t("video_metrics.modal_description")}</DrawerDescription>
        </DrawerHeader>
        {content}
        <DrawerFooter className="px-0">{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
