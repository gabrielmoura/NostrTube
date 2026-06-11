import type { NDKEvent, NDKUserProfile } from "@nostr-dev-kit/ndk-hooks";
import { Avatar, Badge } from "@radix-ui/themes";
import { HiCheckBadge } from "react-icons/hi2";
import { cn, formatCount, getLettersPlain, getNameToShow } from "@/helper/format";
import { RenderText } from "@/components/RenderText";
import { ErrorBoundaryVideo } from "@/routes/v/@components/error";
import { Link } from "@tanstack/react-router";
import { DropdownMenuVideo } from "@/routes/v/@components/DropdownMenuVideo";
import FollowButton from "@/components/FollowButton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VideoMetricsZapButton } from "@/features/video/components/VideoMetricsZapButton";
import { lazy } from "react";

const VideoMeta = lazy(() => import("@/routes/v/@components/VideoMeta"));
const LikeButton = lazy(() => import("@/routes/v/@components/LikeButton"));

interface VideoActionsViewProps {
  event: NDKEvent;
  profile?: NDKUserProfile;
  summary: string;
  title: string;
  followerCount: number;
}

export function VideoActionsView({
  event,
  profile,
  summary,
  title,
  followerCount
}: VideoActionsViewProps) {
  const npub = event.author.npub;
  const tags = event.tags.filter((tag) => tag[0] === "t").map((tag) => tag[1]).filter(Boolean);

  return (
    <div className="space-y-2.5 py-2">
      <div className="flex justify-between">
        <h1 className="text-[1.3rem] text-xl font-semibold">{title}</h1>
      </div>
      <div className="flex flex-wrap justify-between gap-y-3">
        <div className="flex items-center gap-5">
          <div className="flex">
            <Link
              to="/u/$userId"
              params={{ userId: npub }}
              className="center group gap-x-3 rounded-sm rounded-r-full pr-1 text-foreground hover:shadow"
            >
              <Avatar
                className="center h-[34px] w-[34px] overflow-hidden rounded-[.5rem] bg-muted sm:h-[40px] sm:w-[40px]"
                src={profile?.image}
                alt={profile?.displayName}
                fallback={getLettersPlain(profile?.name)}
              />
              <div>
                <div className="flex items-center gap-1">
                  <span className="truncate text-[14px] font-semibold sm:text-[16px]">
                    {getNameToShow({ npub, profile })}
                  </span>
                  {!!profile?.nip05 && (
                    <HiCheckBadge className="h-[12px] w-[12px] text-primary sm:h-[14px] sm:w-[14px]" />
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground sm:text-xs">
                  {followerCount > 0 ? `${formatCount(followerCount)} followers` : ""}
                </p>
              </div>
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <FollowButton pubkey={event.author.pubkey} className="px-4 font-bold" size="sm" />
          </div>
        </div>
        <div className="ml-auto flex items-center gap-3 text-muted-foreground">
          <VideoMetricsZapButton event={event} />
          <ErrorBoundaryVideo>
            <LikeButton contentEvent={event} />
          </ErrorBoundaryVideo>
          <ErrorBoundaryVideo>
            <DropdownMenuVideo event={event} />
          </ErrorBoundaryVideo>
        </div>
      </div>
      <ScrollArea>
        <div className={cn("relative rounded-xl bg-muted p-3", "cursor-pointer transition-all hover:bg-muted-foreground/30")}>
          <ErrorBoundaryVideo>
            <VideoMeta event={event} />
          </ErrorBoundaryVideo>
          <ErrorBoundaryVideo>
            <ScrollArea className="whitespace-break-spaces break-words text-sm text-muted-foreground">
              <RenderText text={summary} />
            </ScrollArea>
          </ErrorBoundaryVideo>
          <div className="mt-2 flex flex-wrap gap-2">
            {tags.map((value, index) => (
              <Link to="/search" search={{ search: undefined, tag: value }} key={`${value}-${index}`}>
                <Badge>{value}</Badge>
              </Link>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
