import { VideoCommentInput } from "@/features/video/components/VideoCommentInput";

export default function CommentInput({
                                       autoFocus,
                                       initialTags
                                      }: {
  autoFocus?: boolean;
  initialTags?: string[][];
}) {
  return <VideoCommentInput autoFocus={autoFocus} initialTags={initialTags} />;
}
