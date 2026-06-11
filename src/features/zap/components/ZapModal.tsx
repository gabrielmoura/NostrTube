import { useEffect, useMemo, useState } from "react";
import { t } from "i18next";
import { useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { HandCoins, ShieldAlert, Wallet } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthModal } from "@/components/AuthModal";
import { modal } from "@/components/modal_v2/modal-manager";
import { useMediaQuery } from "@/components/modal_v2/use-media-query";
import { launchLightningInvoice } from "@/features/zap/services/zap.service";
import { ZapAmountSelector } from "@/features/zap/components/ZapAmountSelector";
import { useZapSubmission } from "@/features/zap/hooks/useZapSubmission";
import type { ZapTarget } from "@/features/zap/types/zap";

interface ZapModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: ZapTarget;
}

function getTargetLabel(target: ZapTarget) {
  if (target.type === "user") {
    return t("zap.target.user");
  }

  return t("zap.target.video");
}

function validateAmount(amount: string) {
  const parsedAmount = Number.parseInt(amount, 10);
  if (!Number.isInteger(parsedAmount) || parsedAmount <= 0) {
    return t("zap.errors.invalid_amount");
  }

  return null;
}

export function ZapModal({ open, onOpenChange, target }: ZapModalProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const currentUser = useNDKCurrentUser();
  const submission = useZapSubmission();
  const [amount, setAmount] = useState("100");
  const [comment, setComment] = useState("");
  const [amountError, setAmountError] = useState<string | null>(null);

  const targetLabel = useMemo(() => getTargetLabel(target), [target]);

  useEffect(() => {
    if (!open) {
      submission.reset();
      setAmountError(null);
      return;
    }
  }, [open, submission]);

  const handleCloseRequest = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }

    if (submission.isSubmitting) return;
    submission.reset();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    const nextAmountError = validateAmount(amount);
    setAmountError(nextAmountError);
    if (nextAmountError) return;

    const result = await submission.submit({
      target,
      amountSats: Number.parseInt(amount, 10),
      comment: comment.trim() || undefined
    });

    if (result?.status === "paid") {
      handleCloseRequest(false);
    }
  };

  const content = (
    <div className="space-y-6" aria-busy={submission.isSubmitting}>
      {!currentUser ? (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5 size-5 text-amber-500" />
            <div className="space-y-3">
              <div>
                <p className="font-medium text-foreground">{t("zap.auth_required.title")}</p>
                <p className="text-sm text-muted-foreground">{t("zap.auth_required.description")}</p>
              </div>
              <Button type="button" variant="outline" onClick={() => modal.show(<AuthModal />, { id: "auth" })}>
                {t("zap.auth_required.action")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="rounded-2xl border bg-card p-4 text-sm">
        <div className="flex items-center gap-2 font-medium text-foreground">
          <HandCoins className="size-4" />
          <span>{t("zap.fields.destination")}</span>
        </div>
        <p className="mt-2 text-muted-foreground">{targetLabel}</p>
      </div>

      <div className="space-y-2">
        <Label>{t("zap.fields.amount")}</Label>
        <ZapAmountSelector amount={amount} onAmountChange={setAmount} disabled={submission.isSubmitting} errorMessage={amountError || undefined} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="zap-comment">{t("zap.fields.note")}</Label>
        <Input
          id="zap-comment"
          value={comment}
          maxLength={240}
          disabled={submission.isSubmitting}
          onChange={(event) => setComment(event.target.value)}
          placeholder={t("zap.fields.note_placeholder")}
        />
      </div>

      {submission.status === "invoice-ready" && submission.invoice ? (
        <div className="rounded-2xl border bg-card p-4">
          <div className="flex items-start gap-3">
            <Wallet className="mt-0.5 size-5 text-primary" />
            <div className="space-y-3">
              <p className="font-medium text-foreground">{t("zap.success.invoice_ready")}</p>
              <p className="text-sm text-muted-foreground">{t("zap.success.invoice_description")}</p>
              <Button type="button" onClick={() => launchLightningInvoice(submission.invoice!)}>
                {t("zap.success.open_wallet")}
              </Button>
            </div>
          </div>
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
      <Button type="button" variant="outline" onClick={() => handleCloseRequest(false)} disabled={submission.isSubmitting}>
        {t("zap.actions.close")}
      </Button>
      <Button type="button" onClick={handleSubmit} isLoading={submission.isSubmitting} disabled={!currentUser}>
        {t("zap.actions.submit")}
      </Button>
    </div>
  );

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleCloseRequest}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("zap.modal_title")}</DialogTitle>
            <DialogDescription>{t("zap.modal_description")}</DialogDescription>
          </DialogHeader>
          {content}
          <DialogFooter>{footer}</DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={open} onOpenChange={handleCloseRequest}>
      <DrawerContent className="px-4 pb-6">
        <DrawerHeader className="px-0 pt-2">
          <DrawerTitle>{t("zap.modal_title")}</DrawerTitle>
          <DrawerDescription>{t("zap.modal_description")}</DrawerDescription>
        </DrawerHeader>
        {content}
        <DrawerFooter className="px-0">{footer}</DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

export type ZapButtonPresentationProps = Pick<ButtonProps, "variant" | "size" | "className">;
