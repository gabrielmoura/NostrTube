import { useState } from "react";
import { t } from "i18next";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeedbackModal } from "@/features/feedback/components/FeedbackModal";

export function FeedbackButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" variant="outline" onClick={() => setOpen(true)} aria-label={t("feedback.header_button_aria")} className="gap-2">
        <MessageSquare className="size-4" />
        <span className="hidden sm:inline">{t("feedback.header_button")}</span>
      </Button>

      <FeedbackModal open={open} onOpenChange={setOpen} />
    </>
  );
}
