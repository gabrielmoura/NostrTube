import { formatNumber, getVideoDetails } from "@/helper/format.ts";
import { relativeTime } from "@/helper/date.ts";
import type { VideoActionsProps } from "@/routes/v/@components/VideoActions.tsx";
import { useEffect, useState } from "react";
import { Spinner } from "@radix-ui/themes";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/videoPlayer/components/Tooltip.tsx";
import { useRecordView } from "@/hooks/useRecordView.ts";
import { useNDK } from "@nostr-dev-kit/ndk-hooks";

export default function VideoMeta({ event }: VideoActionsProps) {
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { ndk } = useNDK();
  const { publishedAt } = getVideoDetails(event);

  const { countView } = useRecordView();
  useEffect(() => {
    countView({
      eventIdentifier: event.dTag as string,
      ndk: ndk!
    }).then(({ totalViews }) => {
      setCount(totalViews);
    }).catch(console.error);
    setIsLoading(false);
  }, [countView, event.dTag, ndk]);


  return <div className="flex items-center gap-x-1.5 text-[13px] font-semibold text-foreground">
    <Tooltip>
      <TooltipContent>
        Está é apenas uma estimativa, não é um dado confiável
      </TooltipContent>
      <TooltipTrigger>
        <p>{!isLoading ? `${formatNumber(count)} views` : <Spinner />}</p>
      </TooltipTrigger>
    </Tooltip>
    {!!publishedAt && (
      <>
        <span>•</span>
        <p>{relativeTime(new Date(publishedAt * 1000))}</p>
      </>
    )}
  </div>;
}