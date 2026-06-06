import { t } from "i18next";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/Image";
import { ButtonUploadThumb } from "@/routes/new/@components/ButtonUploadThumb";
import { ButtonWithLoader } from "@/components/ButtonWithLoader";
import { cn } from "@/helper/format";

interface UploadSidebarViewProps {
  thumbnail?: string;
  canPublish: boolean;
  isPublishing: boolean;
  onThumbnailChange: (value: string) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
}

export function UploadSidebarView({
  thumbnail,
  canPublish,
  isPublishing,
  onThumbnailChange,
  onSaveDraft,
  onPublish
}: UploadSidebarViewProps) {
  return (
    <aside className="w-full lg:max-w-[380px] space-y-5">
      <div className={cn("rounded-xl border bg-card p-4 shadow-sm", thumbnail && "space-y-3")}>
        <label className="text-sm font-medium">Thumbnail</label>
        {thumbnail ? (
          <div className="relative group">
            <Image
              src={thumbnail}
              alt="Thumbnail"
              className="w-full rounded-md border object-cover aspect-video"
              width="288"
            />
            <Button
              variant="secondary"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onThumbnailChange("")}
            >
              Change
            </Button>
          </div>
        ) : (
          <ButtonUploadThumb
            setUrl={(url) => url && onThumbnailChange(url)}
            url={thumbnail}
            accept={{ "image/*": [] }}
          >
            <Button variant="outline" className="w-full">Upload Thumbnail</Button>
          </ButtonUploadThumb>
        )}
      </div>
      <div className="flex items-center gap-3 pt-2">
        <Button variant="outline" size="sm" onClick={onSaveDraft}>
          {t("save_as_draft")}
        </Button>
        <ButtonWithLoader
          size="sm"
          onClick={onPublish}
          isLoading={isPublishing}
          disabled={!canPublish}
        >
          {t("Publish")}
        </ButtonWithLoader>
      </div>
    </aside>
  );
}
