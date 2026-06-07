import type { NDKEvent } from "@nostr-dev-kit/ndk-hooks";
import type { NDKKind } from "@nostr-dev-kit/ndk";
import { nostrNow } from "@/helper/date";

export function buildCommentEventDraft({
  content,
  pubkey,
  initialTags,
  attachmentUrl
}: {
  content: string;
  pubkey: string;
  initialTags?: string[][];
  attachmentUrl?: string;
}) {
  const tags = [...(initialTags ?? [])];
  let noteContent = content.trim();

  if (attachmentUrl) {
    tags.push(["r", attachmentUrl]);
    noteContent = noteContent ? `${noteContent}\n${attachmentUrl}` : attachmentUrl;
  }

  return {
    tags,
    pubkey,
    kind: 1 as NDKKind,
    content: noteContent,
    created_at: nostrNow()
  };
}

export function buildLikeEventDraft({
  contentEvent,
  pubkey,
  action
}: {
  contentEvent: NDKEvent;
  pubkey: string;
  action: string;
}) {
  return {
    created_at: nostrNow(),
    pubkey,
    content: action,
    kind: 7,
    tags: [["e", contentEvent.id]]
  };
}
