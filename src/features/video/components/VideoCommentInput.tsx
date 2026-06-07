import { lazy } from "react";
import { HiOutlinePaperClip, HiX } from "react-icons/hi";
import { Avatar } from "@radix-ui/themes";
import { t } from "i18next";
import { Button } from "@/components/button";
import { cn, getTwoLetters } from "@/helper/format";
import { useVideoCommentController } from "@/features/video/hooks/use-video-comment-controller";

const Textarea = lazy(() => import("@/components/textarea"));

export function VideoCommentInput({
  autoFocus,
  initialTags
}: {
  autoFocus?: boolean;
  initialTags?: string[][];
}) {
  const controller = useVideoCommentController(initialTags);

  if (!controller.currentUser) {
    return <div>É necessário estar logado para comentar...</div>;
  }

  return (
    <div className="flex gap-x-4">
      <div className="flex w-[40px] shrink-0 flex-col py-[7px]">
        <Avatar
          className="center h-[40px] w-[40px] overflow-hidden rounded-[.55rem] bg-muted object-cover"
          src={controller.currentProfile?.image}
          alt={controller.currentProfile?.displayName || controller.currentUser.pubkey}
          fallback={getTwoLetters({
            npub: controller.currentUser.npub as string,
            profile: controller.currentProfile
          })}
        />
      </div>
      <div className="hover:text-1 focus-within:border-text w-full flex-1 rounded-lg border focus-within:ring-0">
        <div className="flex w-full items-stretch gap-x-4 p-3 pl-4">
          <div className="w-full space-y-4">
            <div>
              <Textarea
                ref={controller.contentRef}
                value={controller.content}
                onChange={(event) => controller.setContent(event.target.value)}
                placeholder={`${t("leave_a_comment")}...`}
                autoFocus={autoFocus}
                className={cn("invisible-textarea min-h-[50px] text-base font-medium text-foreground placeholder:text-muted-foreground/70")}
              />
              <div className="mt-1 w-full">
                <div className="flex w-full items-center justify-between text-muted-foreground">
                  {controller.attachmentPreview ? (
                    <div className="relative overflow-hidden rounded-xl">
                      <img src={controller.attachmentPreview} alt="Attachment preview" className="max-h-[140px] rounded-xl object-cover" />
                      <button
                        type="button"
                        onClick={controller.clearAttachment}
                        className="center absolute left-1 top-1 rounded-full bg-foreground bg-opacity-70 p-1 hover:bg-opacity-100"
                      >
                        <HiX className="block h-4 w-4 text-background" aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        ref={controller.fileInputRef}
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            void controller.selectAttachment(file);
                          }
                        }}
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        className="rounded-full"
                        onClick={() => controller.fileInputRef.current?.click()}
                      >
                        <HiOutlinePaperClip className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  <div className="center mt-auto">
                    <Button
                      variant="default"
                      size="default"
                      disabled={controller.isUploadingImage}
                      loading={controller.isPending}
                      onClick={controller.submit}
                      className="rounded-full"
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
