import { useMutation } from "@tanstack/react-query";
import { NDKEvent, useCurrentUserProfile, useNDK, useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { useRef, useState } from "react";
import { makeEvent, type MakeEventParams } from "@/helper/pow/pow";
import { LoggerAgent } from "@/lib/debug";
import { buildCommentEventDraft } from "@/features/video/services/video-interactions.service";
import { useBlossomUpload } from "@/hooks/useBlossomUpload";

interface UseVideoCommentControllerOptions {
  initialTags?: string[][];
  onSubmitted?: (event: NDKEvent) => void;
}

export function useVideoCommentController({ initialTags, onSubmitted }: UseVideoCommentControllerOptions = {}) {
  const log = LoggerAgent.create("CommentInput");
  const [content, setContent] = useState("");
  const contentRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const attachmentPreviewRef = useRef<string | undefined>(undefined);
  const [attachmentPreview, setAttachmentPreview] = useState<string | undefined>();
  const [attachmentUrl, setAttachmentUrl] = useState<string | undefined>();
  const { ndk } = useNDK();
  const currentProfile = useCurrentUserProfile();
  const currentUser = useNDKCurrentUser();
  const upload = useBlossomUpload({
    onSuccess: (uploadedUrl) => setAttachmentUrl(uploadedUrl),
    onError: () => {
      setAttachmentPreview(undefined);
      setAttachmentUrl(undefined);
    }
  });

  const mutation = useMutation({
    mutationKey: ["event:generate", "comment", initialTags],
    mutationFn: ({ ndk, event, difficulty }: MakeEventParams): Promise<NDKEvent> =>
      makeEvent({
        ndk,
        event,
        difficulty
      }),
    onSuccess: (event) => event.publish()
  });

  const submit = async () => {
    if (!ndk || !currentUser) return;
    if (!content.trim() && !attachmentUrl) return;

    try {
      const eventDraft = buildCommentEventDraft({
        content,
        pubkey: currentUser.pubkey,
        initialTags,
        attachmentUrl
      });

      const publishedEvent = await mutation.mutateAsync({
        ndk,
        event: eventDraft,
        difficulty: Number(import.meta.env.VITE_MIN_COMMENT_POW ?? 10)
      });

      onSubmitted?.(publishedEvent);

      setContent("");
      setAttachmentPreview(undefined);
      setAttachmentUrl(undefined);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      log.error("err", error);
    }
  };

  const selectAttachment = async (file: File) => {
    if (attachmentPreviewRef.current) {
      URL.revokeObjectURL(attachmentPreviewRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    attachmentPreviewRef.current = previewUrl;
    setAttachmentPreview(previewUrl);
    const result = await upload.uploadFile(file);
    if (result?.url) {
      setAttachmentUrl(result.url);
    }
  };

  const clearAttachment = () => {
    if (attachmentPreviewRef.current) {
      URL.revokeObjectURL(attachmentPreviewRef.current);
      attachmentPreviewRef.current = undefined;
    }

    setAttachmentPreview(undefined);
    setAttachmentUrl(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return {
    content,
    setContent,
    contentRef,
    fileInputRef,
    currentProfile,
    currentUser,
    upload,
    attachmentPreview,
    selectAttachment,
    clearAttachment,
    submit,
    isPending: mutation.isPending,
    isUploadingImage: upload.isUploading
  };
}
