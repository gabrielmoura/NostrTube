import type {NDKEvent} from "@nostr-dev-kit/ndk-hooks";
import LikeToggleButton from "../../../components/LikeToggleButton.tsx";

type LikeButtonProps = {
    contentEvent: NDKEvent;
};
export default function LikeButton({contentEvent}: LikeButtonProps) {
    const upVotes = 0

    async function handleLike(action: string) {
        console.log(action)
    }

    const activeReaction = "+"
    return (
        <LikeToggleButton
            active={activeReaction}
            likeCount={upVotes}
            onClick={(action) => {
                handleLike(action);
            }}
        />
    );
}