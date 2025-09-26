import type {NDKEvent, NDKKind} from "@nostr-dev-kit/ndk";


import {HiHandThumbDown, HiHandThumbUp, HiOutlineHandThumbDown, HiOutlineHandThumbUp,} from "react-icons/hi2";
// import {modal} from "@/app/_providers/modal";
// import AuthModal from "@/components/modals/auth";
import {useCurrentUserProfile, useNDK, useSubscribe} from "@nostr-dev-kit/ndk-hooks";
import {Button} from "@/components/button.tsx";
import {makeEvent} from "@/helper/pow/pow.ts";
import {formatCount} from "@/helper/format.ts";
import {nostrNow} from "@/helper/date.ts";

type ReactionButtosProps = {
    event: NDKEvent;
};
export default function ReactionButtons({event}: ReactionButtosProps) {
    const currentUser = useCurrentUserProfile()
    const {ndk} = useNDK();
    const {events} = useSubscribe([{
        kinds: [7 as NDKKind],
        "#e": [event.id],
    }])
    const downVotes = [...events]?.filter((e) => e.content === "-").length;
    const upVotes = events?.size||events?.length - downVotes;

    async function handleLike(action: string) {
        if (!currentUser || !ndk) return;
        try {
            const newEvent = await makeEvent({
                ndk,
                event: {
                    content: action,
                    pubkey: currentUser.pubkey,
                    tags: [["e", event.id]],
                    kind: 7,
                    created_at: nostrNow(),
                },
                difficulty: 10,
            });
            if (newEvent) {
                console.log("Event", newEvent);
            } else {
                console.log("Error adding reaction");
            }
        } catch (err) {
            console.log("error submitting event", err);
        }
    }

    const activeReaction = [...events]?.filter(
        (e) => e.pubkey === currentUser?.pubkey,
    )?.[0]?.content as "-" | "+" | "" | undefined;

    function handleReact(action: "+" | "-") {
        if (currentUser) {
            handleLike(action);
        } else {
            // modal.show(<AuthModal/>, {
            //     id: "login",
            // });
            console.log("modal")
            throw new Error("Authentication required");
        }
    }

    return (
        <div className="flex items-center gap-1">
            <Button
                onClick={() => handleReact("+")}
                disabled={!currentUser}
                size="sm"
                variant="ghost"
                className="gap-x-1.5 px-2"
            >
                {activeReaction === "+" ? (
                    <HiHandThumbUp className="h-4 w-4"/>
                ) : (
                    <HiOutlineHandThumbUp className="h-4 w-4"/>
                )}
                {!!upVotes && (
                    <span className="text-xs font-bold">{formatCount(upVotes)}</span>
                )}
            </Button>
            <Button
                onClick={() => handleReact("-")}
                disabled={!currentUser}
                size="sm"
                variant="ghost"
                className="gap-x-1.5 px-2"
            >
                {activeReaction === "-" ? (
                    <HiHandThumbDown className="h-4 w-4"/>
                ) : (
                    <HiOutlineHandThumbDown className="h-4 w-4"/>
                )}
            </Button>
        </div>
    );
}
