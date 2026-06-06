import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useNDK } from "@nostr-dev-kit/ndk-hooks";
import { Sparkles } from "lucide-react";
import VideoCard, { VideoCardLoading } from "@/components/cards/videoCard";
import { getVideosFromSearchData } from "@/helper/loaders/getVideosFromSearchData";

interface RecommendationRailProps {
  title: string;
  subtitle?: string;
  tags: string[];
  excludeEventId?: string;
}

export function RecommendationRail({ title, subtitle, tags, excludeEventId }: RecommendationRailProps) {
  const { ndk } = useNDK();
  const activeTags = tags.filter(Boolean).slice(0, 3);

  const query = useQuery({
    queryKey: ["recommendations", activeTags, excludeEventId],
    enabled: Boolean(ndk && activeTags.length > 0),
    queryFn: async () => {
      const events = await getVideosFromSearchData({ ndk: ndk!, tag: activeTags, timeRange: "all" });
      return events.filter((event) => event.id !== excludeEventId).slice(0, 8);
    }
  });

  if (!activeTags.length) return null;

  return (
    <section className="space-y-4 px-4 sm:px-5">
      <div className="flex items-center gap-3">
        <div className="inline-flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="size-4" />
        </div>
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
      </div>

      <div className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {query.isLoading
          ? Array.from({ length: 4 }).map((_, index) => <VideoCardLoading key={index} />)
          : query.data?.map((event) => (
            <Link
              key={event.id}
              to="/v/$eventId"
              params={{ eventId: event.encode() }}
              className="block w-full rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <VideoCard event={event} />
            </Link>
          ))}
      </div>
    </section>
  );
}
