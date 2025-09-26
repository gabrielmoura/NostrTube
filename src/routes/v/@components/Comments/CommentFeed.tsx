import {NDKEvent} from "@nostr-dev-kit/ndk";
import CommentBody from "./CommentBody";
import {t} from "i18next";

type CommentFeedProps = {
    comments: NDKEvent[];
};
export default function CommentFeed({comments}: CommentFeedProps) {
    if (comments.length === 0) {
        return (
            <div className="center py-2 text-sm text-muted-foreground">
                <p>{t('no_comments_yet')}</p>
            </div>
        );
    }
    return (
        <div className="w-full">
            <ul className="space-y-2">
                {comments.map((c) => (
                    <li key={c.id}>
                        <CommentBody event={c}/>
                    </li>
                ))}
            </ul>
        </div>
    );
}
