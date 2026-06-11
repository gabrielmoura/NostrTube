import { useState, type ReactNode } from "react";
import { t } from "i18next";
import { HandCoins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ZapModal, type ZapButtonPresentationProps } from "@/features/zap/components/ZapModal";
import type { ZapTarget } from "@/features/zap/types/zap";
import type { NDKEvent } from "@nostr-dev-kit/ndk";

type ZapButtonProps = ZapButtonPresentationProps & {
  children?: ReactNode;
} & (
  | {
    zapType: "user";
    pubkey: string;
  }
  | {
    zapType: "event";
    event: NDKEvent;
  }
);

function getTarget(props: ZapButtonProps): ZapTarget {
  if (props.zapType === "user") {
    return {
      type: "user",
      pubkey: props.pubkey
    };
  }

  return {
    type: "event",
    event: props.event
  };
}

export function ZapButton(props: ZapButtonProps) {
  const [open, setOpen] = useState(false);
  const target = getTarget(props);

  return (
    <>
      <Button
        type="button"
        variant={props.variant ?? "secondary"}
        size={props.size ?? "sm"}
        className={props.className}
        onClick={() => setOpen(true)}
      >
        <HandCoins className="size-4" />
        {props.children ?? t("zap.actions.open")}
      </Button>

      <ZapModal open={open} onOpenChange={setOpen} target={target} />
    </>
  );
}
