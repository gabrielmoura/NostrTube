import type {NDKEvent} from "@nostr-dev-kit/ndk-hooks";
import {NDKSubscriptionCacheUsage, useCurrentUserProfile, useFollows, useProfileValue} from "@nostr-dev-kit/ndk-hooks";
import {Avatar, Badge, Button, Skeleton} from "@radix-ui/themes";
import {HiCheckBadge} from "react-icons/hi2";
import {cn, formatCount, getLettersPlain, getNameToShow, getVideoDetails} from "@/helper/format.ts";
import {RenderText} from "@/components/RenderText.tsx";
import {ErrorBoundaryVideo} from "./error.tsx";
import {getTagValues} from "@welshman/util";
import LikeButton from "./LikeButton.tsx";
import {Link} from "@tanstack/react-router";
import LikeToggleButton from "@/components/LikeToggleButton.tsx";
import {VideoMeta} from "@/routes/v/@components/VideoMeta.tsx";

export type VideoActionsProps = {
    event: NDKEvent;
    eventIdentifier?: string;
};
export default function VideoActions({event, eventIdentifier}: VideoActionsProps) {
    // const [profile, setProfile] = useState<NDKUserProfile | undefined>()

    const npub = event.author.npub;


    const profile = useProfileValue(event.author.npub, {
        subOpts: {
            closeOnEose: true,
            cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
        }
    })
    const followers = useFollows()


    const {summary, title} = getVideoDetails(event);


    return (
        <div className="space-y-2.5 py-2">
            {/* Title Section */}
            <div className="flex justify-between">
                <h1 className="text-[1.3rem] text-xl font-semibold">{title}</h1>
            </div>

            {/* Detials Section */}
            <div className="flex flex-wrap justify-between gap-y-3">
                {/* Channel */}
                <div className="flex items-center gap-5">
                    {/* Channel Section */}
                    <div className="flex">
                        <Link
                            to={`/u/$userId`}
                            params={{
                                userId: npub,
                            }}
                            className="center group gap-x-3 rounded-sm rounded-r-full pr-1 text-foreground hover:shadow"
                        >
                            <Avatar
                                className="center h-[34px] w-[34px] overflow-hidden rounded-[.5rem] bg-muted sm:h-[40px] sm:w-[40px]"
                                src={profile?.image}
                                alt={profile?.displayName}
                                fallback={getLettersPlain(profile?.name)}
                            />


                            <div className="">
                                <div className="flex items-center gap-1">
                  <span className="truncate text-[14px] font-semibold sm:text-[16px]">
                    {getNameToShow({npub, profile})}
                  </span>
                                    {!!profile?.nip05 && (
                                        <HiCheckBadge
                                            className="h-[12px] w-[12px] text-primary sm:h-[14px] sm:w-[14px]"/>
                                    )}
                                </div>
                                <p className="text-[11px] text-muted-foreground sm:text-xs">
                                    {!!followers.size &&
                                        `${formatCount(followers?.size)} followers`}
                                </p>
                            </div>
                        </Link>
                    </div>
                    {/* Channel Action Section */}
                    <div className="flex items-center gap-2">
                        {/*<FollowButton*/}
                        {/*    size={"sm"}*/}
                        {/*    className="px-4 font-bold"*/}
                        {/*    pubkey={event.author.pubkey}*/}
                        {/*/>*/}
                        {/*<ZapButton*/}
                        {/*    zapType="event"*/}
                        {/*    event={event.rawEvent()}*/}
                        {/*    size={"sm"}*/}
                        {/*    className="px-4 font-bold"*/}
                        {/*    variant={"secondary"}*/}
                        {/*/>*/}
                    </div>
                </div>
                {/* Video actions */}
                <ErrorBoundaryVideo>
                    <VideoActionsInternal event={event}/>
                </ErrorBoundaryVideo>
            </div>

            {/* Metadata Section */}
            <div

                className={cn(
                    "relative rounded-xl bg-muted p-3",
                    "cursor-pointer transition-all hover:bg-muted-foreground/30",
                )}
            >
                <ErrorBoundaryVideo>
                    <VideoMeta event={event} eventIdentifier={eventIdentifier}/>
                </ErrorBoundaryVideo>
                <ErrorBoundaryVideo>
                    <div className="overflow-hidden whitespace-break-spaces break-words text-sm text-muted-foreground">
                        <RenderText text={summary}/>
                    </div>
                </ErrorBoundaryVideo>
                <VideoTags event={event}/>
                {/*<ExpandButton className="absolute inset-x-0 bottom-0 z-20 mt-[-55px]">*/}
                {/*    <div className="h-[40px] w-full bg-gradient-to-b from-transparent to-muted"></div>*/}
                {/*    <div className="h-[25px] bg-muted text-xs font-medium leading-none">*/}
                {/*        <span>See more...</span>*/}
                {/*    </div>*/}
                {/*</ExpandButton>*/}
            </div>
        </div>
    );
}


function VideoTags({event}: VideoActionsProps) {
    const tags = getTagValues("t", event.tags);

    return (
        <>
            {tags.map((value, index) => (
                <Link to="/search" search={{tag: value as string}} key={index}>
                    <Badge>{value}</Badge>
                </Link>
            ))}
        </>
    );
}


function VideoActionsInternal({event}: VideoActionsProps) {

    // function handleDownload() {
    //     // const promise = downloadVideo(url, title);
    //     // toast.promise(promise, {
    //     //     loading: "Loading...",
    //     //     success: (data) => {
    //     //         return `Video has been downloaded`;
    //     //     },
    //     //     error: "Error",
    //     // });
    // }

    return <>
        <div className="ml-auto flex items-center gap-3 text-muted-foreground">
            <ErrorBoundaryVideo>
                <LikeButton contentEvent={event}/>
            </ErrorBoundaryVideo>
            {/*<DropDownOptions*/}
            {/*    options={[*/}
            {/*        {*/}
            {/*            label: "Share video",*/}
            {/*            action: () => {*/}
            {/*                copyText(*/}
            {/*                    `${*/}
            {/*                        process.env.NEXT_PUBLIC_ROOT_DOMAIN ??*/}
            {/*                        "https://www.flare.pub"*/}
            {/*                    }/w/${event.encode()}`,*/}
            {/*                );*/}
            {/*                toast.success("Link copied!");*/}
            {/*            },*/}
            {/*        },*/}
            {/*        {*/}
            {/*            label: "Add to Playlist",*/}
            {/*            action: () => {*/}
            {/*                modal.show(*/}
            {/*                    <AddToPlaylistModal eventIdentifier={event.tagId()}/>,*/}
            {/*                );*/}
            {/*            },*/}
            {/*        },*/}
            {/*        {*/}
            {/*            label: "Download video",*/}
            {/*            action: () => {*/}
            {/*                handleDownload();*/}
            {/*            },*/}
            {/*        },*/}
            {/*        {*/}
            {/*            label: "Copy raw event",*/}
            {/*            action: () => {*/}
            {/*                copyText(JSON.stringify(rawEvent));*/}
            {/*                toast.success("Copied event");*/}
            {/*            },*/}
            {/*        },*/}
            {/*        ...(currentUser?.pubkey === event.author.pubkey*/}
            {/*            ? [*/}
            {/*                {*/}
            {/*                    label: "Edit Event",*/}
            {/*                    action: () => {*/}
            {/*                        router.push(*/}
            {/*                            `/video/${getTagValues("d", event.tags) ?? ""}/edit`,*/}
            {/*                        );*/}
            {/*                    },*/}
            {/*                },*/}
            {/*            ]*/}
            {/*            : []),*/}
            {/*    ]}*/}
            {/*/>*/}
        </div>
    </>
}

export function VideoActionsLoading() {
    const profile = useCurrentUserProfile()
    return (
        <div className="space-y-2.5 py-2">
            {/* Title Section */}
            <div className="my-3 flex justify-between">
                <Skeleton className="h-6 w-3/4 bg-muted"/>
            </div>

            {/* Detials Section */}
            <div className="flex flex-wrap justify-between gap-y-3">
                {/* Channel */}
                <div className="flex items-center gap-5">
                    {/* Channel Section */}
                    <div className="flex">
                        <div
                            className="center group gap-x-3 rounded-sm rounded-r-full pr-1 text-foreground hover:shadow">
                            <Avatar
                                className="center h-[34px] w-[34px] overflow-hidden rounded-[.5rem] bg-muted sm:h-[40px] sm:w-[40px]"
                                fallback={getLettersPlain(profile?.name)}
                            />
                            <div className="">
                                <div className="mb-1.5 flex items-center gap-1">
                                    <Skeleton className="h-[12px] w-[100px] bg-muted"/>
                                </div>
                                <Skeleton className="h-[9px] w-[70px] bg-muted"/>
                            </div>
                        </div>
                    </div>
                    {/* Channel Action Section */}
                    <div className="flex items-center gap-2">
                        <Button disabled className="px-4 font-bold">
                            Follow
                        </Button>
                        <Button
                            disabled

                            className="px-4 font-bold"

                        >
                            Zap
                        </Button>
                    </div>
                </div>
                {/* Video actions */}
                <div className="ml-auto flex items-center gap-3 text-muted-foreground">
                    <LikeToggleButton likeCount={0} onClick={() => {
                    }}/>
                    {/*<DropDownOptions options={[]}/>*/}
                </div>
            </div>
            {/* Metadata Section */}
            <div
                className={cn(
                    "rounded-xl bg-muted p-3",
                    "cursor-pointer transition-all",
                )}
            >
                <div className="space-y-1.5 pt-1 text-sm text-muted-foreground">
                    <Skeleton className="h-3 w-3/4 bg-background"/>
                    <Skeleton className="h-3 w-2/5 bg-background"/>
                    <Skeleton className="h-3 w-2/3 bg-background"/>
                    <Skeleton className="h-3 w-3/5 bg-background"/>
                </div>
            </div>
        </div>
    );
}