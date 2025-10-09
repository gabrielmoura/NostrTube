import type {NDKEvent, NDKUserProfile} from "@nostr-dev-kit/ndk-hooks";
import {NDKSubscriptionCacheUsage} from "@nostr-dev-kit/ndk-hooks";
import {cn, formatCount, getNameToShow, getTwoLetters, ifHasString} from "@/helper/format.ts";
import {AspectRatio, Avatar, Skeleton} from "@radix-ui/themes";
import {HiCheckBadge} from "react-icons/hi2";
import {relativeTime} from "@/helper/date.ts";
import {Link} from "@tanstack/react-router";
import {extractTag} from "@/helper/extractTag.ts";
import {useEffect, useState} from "react";
import {Image} from "@/components/Image.tsx";
import {getTagValue} from "@welshman/util";
import NostrNotFound from "@/components/logo/NostrNotFound.tsx";
import {IconNSFW} from "@/components/logo/IconNSFW.tsx";

type VideoCardProps = {
    className?: string;
    event: NDKEvent;
};


export default function VideoCard({className, event,}: VideoCardProps) {
    const npub = event.author.npub;
    const [isLoading, setLoading] = useState<boolean>(true)


    const {image, thumb, title, published_at: publishedAt} = extractTag(event.tags);
    const thumbnail = ifHasString(thumb, image);
    const [profile, setProfile] = useState<NDKUserProfile | undefined>()
    const nsfw = getTagValue("content-warning", event.tags);

    // if (!thumbnail ||thumbnail=="") return null;
    useEffect(() => {
        event.author.fetchProfile({cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST}, true).then((p) => {
            if (p) {
                setProfile(p)
            }
            setLoading(false)
        });
    }, [event.author]);

    if (isLoading) {
        return <VideoCardLoading/>
    }
    return (
        <div
            className={cn(
                "group flex w-full flex-col space-y-3 rounded-2xl p-3 transition hover:bg-muted/70 hover:shadow-md",
                className
            )}
        >
            {/* Thumbnail */}
            <div className="relative overflow-hidden rounded-lg">
                <AspectRatio ratio={16 / 9} className="bg-muted">
                    {nsfw?.length > 0 ? <IconNSFW
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 grayscale-2"/> : (thumbnail) ?
                        <Image
                            src={thumbnail}
                            alt={title ? `Thumbnail do vídeo: ${title}` : "Thumbnail do vídeo"}
                            className={cn("h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 grayscale-2", {" bg-red-400/25": nsfw?.length > 0})}
                            width={"200"}/> : <div style={{
                            backgroundColor: "hsl(12 6.5% 15.1%)",
                            position: "absolute",
                            inset: "0px"
                        }
                        }>
                            {/*<Image*/}
                            {/*    src={thumbNotFound as string}*/}
                            {/*    alt={title ? `Thumbnail do vídeo: ${title}` : "Thumbnail do vídeo"}*/}
                            {/*    width="200"*/}
                            {/*    className={cn("h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 blur-xs grayscale")}*/}
                            {/*/>*/}
                            <NostrNotFound
                                className="absolute top-1/2 left-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 opacity-80"/>
                        </div>}


                </AspectRatio>
            </div>

            {/* Video Meta */}
            <div className="flex flex-col space-y-1">
                <h3 className="line-clamp-2 font-medium leading-snug">{title}</h3>
            </div>

            {/* Channel Info + Views */}
            <div className="flex items-center justify-between pr-2 text-sm text-muted-foreground">
                <Link
                    to="/u/$userId"
                    params={{userId: npub}}
                    tabIndex={0}
                    aria-label={`Abrir canal de ${getNameToShow({npub, profile})}`}
                    className="flex items-center gap-2 rounded-md px-1 py-0.5 transition hover:bg-muted focus:ring-2 focus:ring-primary"
                >
                    <Avatar
                        src={profile?.image}
                        alt={profile?.displayName ?? "Avatar"}
                        fallback={getTwoLetters({npub})}
                        className="h-7 w-7 rounded-md transition-transform duration-200 group-hover:scale-105"
                    />
                    <span className="flex items-center gap-1 text-sm font-semibold">
                        {getNameToShow({npub, profile})}
                        {profile?.nip05 && <HiCheckBadge className="h-4 w-4 text-primary"/>}
          </span>
                </Link>

                <div className="flex items-center gap-1 text-xs">
                    <span>{`${formatCount(123)} views`}</span>
                    {publishedAt && (
                        <>
                            <span>•</span>
                            <time dateTime={new Date(publishedAt * 1000).toISOString()}>
                                {relativeTime(new Date(publishedAt * 1000))}
                            </time>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export function VideoCardLoading({className}: Omit<VideoCardProps, "event">) {
    return (
        <div
            className={cn(
                "flex flex-col space-y-3 rounded-2xl p-3 animate-pulse",
                className
            )}
        >
            {/* Thumbnail skeleton */}
            <div className="overflow-hidden rounded-lg">
                <AspectRatio ratio={16 / 9} className="bg-muted"/>
            </div>

            {/* Title skeleton */}
            <Skeleton className="h-4 w-3/4 rounded bg-muted"/>

            {/* Channel info skeleton */}
            <div className="flex items-center gap-2">
                <Avatar className="h-7 w-7 rounded-md bg-muted" fallback=""/>
                <Skeleton className="h-4 w-24 rounded bg-muted"/>
            </div>
        </div>
    );
}
