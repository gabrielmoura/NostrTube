import { lazy, useRef, useState } from "react";


import { HiOutlinePaperClip } from "react-icons/hi";
import { cn, getTwoLetters } from "@/helper/format.ts";
// import {Textarea} from "@/components/textarea.tsx";
import { Avatar } from "@radix-ui/themes";
import useUpload from "@/hooks/useUpload.tsx";
import { NDKEvent, NDKKind, useCurrentUserProfile, useNDK, useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";
import { makeEvent, type makeEventParams } from "@/helper/pow/pow.ts";
import { useMutation } from "@tanstack/react-query";
import { nostrNow } from "@/helper/date.ts";
import { t } from "i18next";
import { Button } from "@/components/button.tsx";
import { LoggerAgent } from "@/lib/debug.ts";

const Textarea = lazy(() => import("@/components/textarea.tsx"));

export default function CommentInput({

                                       autoFocus,
                                       initialTags
                                     }: {
  autoFocus?: boolean;
  initialTags?: string[][];
}) {
  const log = LoggerAgent.create("CommentInput");
  const [content, setContent] = useState("");

  const {
    UploadButton,
    ImagePreview,
    clear,
    imagePreview,
    fileUrl,
    status: imageStatus
  } = useUpload({ folderName: "event" });

  const { ndk } = useNDK();
  const currentProfile = useCurrentUserProfile();
  const currentUser = useNDKCurrentUser();

  const contentRef = useRef<HTMLTextAreaElement | undefined>(undefined);

  const makeEventMut = useMutation({
    mutationKey: ["event:generate", "comment", initialTags],
    mutationFn: ({ ndk, event, difficulty }: makeEventParams): Promise<NDKEvent> => makeEvent({
      ndk,
      event,
      difficulty
    }),
    onSuccess: (event) => event.publish()
  });

  // useAutosizeTextArea(contentRef.current, content);

  async function handleSubmit() {
    if (!ndk || !currentUser) return;
    // setIsLoading(true);
    try {
      const tags: string[][] = initialTags ?? [];
      let noteContent = content;


      if (fileUrl) {
        tags.push(["r", fileUrl]);
        noteContent += `\n${fileUrl}`;
      }

      await makeEventMut.mutateAsync({
        ndk: ndk,
        event: {
          tags: tags,
          pubkey: currentUser.pubkey,
          kind: NDKKind.Text,
          content: noteContent,
          created_at: nostrNow()
        },
        difficulty: 10
      });


      // const event = new NDKEvent(ndk, preEvent)
      // await event.sign();
      // const published=await event.publish();

      // if (published) {
      //     console.log("published", published)
      // }

      // if (event) {
      //     toast.success("Comment created!");
      // } else {
      //     toast.error("An error occured");
      // }
    } catch (err) {
      log.error("err", err);
    } finally {
      setContent("");
      clear();
      // setIsLoading(false);
    }
  }

  //
  if (!currentUser) {
    return <div>É necessário estar logado para comentar...</div>;
  }
  return (
    <div className="flex gap-x-4">
      {currentUser && (
        <div className="flex w-[40px] shrink-0 flex-col py-[7px]">

          <Avatar
            className="center h-[40px] w-[40px] overflow-hidden rounded-[.55rem] bg-muted   object-cover"
            src={currentProfile?.image}
            alt={currentProfile?.displayName || currentUser.pubkey}
            fallback={getTwoLetters({
              npub: currentUser.npub as string,
              profile: currentProfile
            })} />
        </div>
      )}
      <div className="hover:text-1 focus-within:border-text w-full flex-1 rounded-lg border focus-within:ring-0">
        <div className="flex w-full items-stretch gap-x-4 p-3 pl-4">
          <div className="w-full space-y-4">
            <div className="">
              <Textarea
                ref={contentRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("leave_a_comment") + "..."}
                autoFocus={autoFocus}
                className={cn(
                  "invisible-textarea min-h-[50px] text-base font-medium text-foreground placeholder:text-muted-foreground/70"
                )}
              />
              <div className="mt-1 w-full">
                <div className="flex w-full items-center justify-between text-muted-foreground">
                  {imagePreview ? (
                    <ImagePreview className="" />
                  ) : (
                    <UploadButton>
                      <Button
                        asChild
                        size="icon"
                        variant="outline"
                        className="rounded-full"
                      >
                        <HiOutlinePaperClip className="h-4 w-4" />
                      </Button>
                    </UploadButton>
                  )}
                  <div className="center mt-auto">
                    <Button
                      variant="default"
                      size="default"
                      disabled={imageStatus === "uploading"}
                      loading={makeEventMut.isPending}
                      onClick={handleSubmit}
                      className=" rounded-full"
                    >
                      {t("comment")}

                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
