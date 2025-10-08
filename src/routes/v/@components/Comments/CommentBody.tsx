import type {NDKEvent} from "@nostr-dev-kit/ndk";
import {HiCheckBadge} from "react-icons/hi2";


// import ReactionButtons from "./ReactionButtons";
import {RenderText} from "@/components/RenderText.tsx";
import {getNameToShow, getTwoLetters} from "@/helper/format.ts";
import {relativeTime} from "@/helper/date.ts";
import {Avatar} from "@radix-ui/themes";
// import ReactionButtons from "@/routes/v/@components/Comments/ReactionButtons.tsx";
import {NDKSubscriptionCacheUsage, NDKUserProfile} from "@nostr-dev-kit/ndk-hooks";
import {lazy, useEffect, useState} from "react";
const ReactionButtons = lazy(()=>import("@/routes/v/@components/Comments/ReactionButtons.tsx"))

type CommentBodyProps = {
    event: NDKEvent;
};
export default function CommentBody({event}: CommentBodyProps) {
    const npub = event.author.npub;
    const [profile, setProfile] = useState<NDKUserProfile | undefined>()

    useEffect(() => {
        event.author.fetchProfile({cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST}, true).then((p) => (p) ? setProfile(p) : "");
    }, [event.author]);
    return (
        <div className="flex w-full gap-x-4 overflow-hidden">
            <Avatar className="center h-[40px] w-[40px] overflow-hidden rounded-[.55rem] bg-muted   object-cover"
                    src={profile?.image}
                    alt={profile?.displayName}
                    fallback={getTwoLetters({
                        npub: npub,
                        profile: profile,
                    })}
            />

            <div className="space-y-1 overflow-hidden">
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                     <span className="line-clamp-1 text-[14px] font-semibold">
                        {getNameToShow({npub, profile})}
                     </span>
                        {!!profile?.nip05 && (
                            <HiCheckBadge className="h-[14px] w-[14px] shrink-0 text-primary"/>
                        )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                        {relativeTime(new Date((event.created_at ?? 0) * 1000))}
                    </p>
                </div>
                <div className="break-words">
                    <RenderText text={event.content}/>
                </div>
                <ReactionButtons event={event}/>
            </div>
        </div>
    );
}
