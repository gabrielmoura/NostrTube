import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { RiUploadCloud2Line } from "react-icons/ri";
import { CircleDotDashed, FileVideo, Link2 } from "lucide-react";
import { toast } from "sonner";
import { t } from "i18next";

import { cn } from "@/helper/format.ts";
import { Button } from "@/components/ui/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { useVideoUploader } from "@/hooks/useVideoUploader.ts";
import { useVideoUploadStore } from "@/store/videoUpload/useVideoUploadStore.ts";

export default function VideoUploadFile() {
  const { upload, isLoading, progress, uploadStage } = useVideoUploader();
  // Estado local apenas para preview da imagem/nome antes do upload começar
  const [, setPreviewFile] = useState<File | null>(null);
  const setShowEventInput = useVideoUploadStore((s) => s.setShowEventInput);
  const uploadError = useVideoUploadStore((s) => s.error);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setPreviewFile(file);
      upload(file);
    }
  }, [upload]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "video/*": [] },
    disabled: isLoading,
    multiple: false,
    onDropRejected: () => toast.error(t("invalid_file_type", "Invalid file type"))
  });

  // Limpa o preview se houver erro para permitir nova tentativa imediatamente.
  useEffect(() => {
    if (uploadStage === "error") {
      setPreviewFile(null);
    }
  }, [uploadStage]);

  if (isLoading) {
    return (
      <Card className="relative flex min-h-[360px] w-full items-center justify-center overflow-hidden rounded-3xl border-border/70 bg-card/80 p-6">
        <CardContent className="flex flex-col items-center text-center p-0">
          <CircleDotDashed className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
          <p className="text-lg font-semibold mb-2">
            {t("Sending_files", "Sending files")}... {progress}%
          </p>
          <Progress value={progress} className="w-[200px] mb-4" />
          <p className="text-xs text-muted-foreground">
            {uploadStage === "processing"
              ? t("processing_video", "Processing video metadata...")
              : t("uploading_to_relays", "Uploading your media...")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      className="relative flex min-h-[420px] w-full flex-col justify-center gap-4 overflow-hidden rounded-3xl bg-secondary/20 p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_40%)]" />
      <div
        {...getRootProps()}
        className={cn(
          "relative flex w-full cursor-pointer justify-center rounded-3xl border border-dashed border-foreground/25 bg-background/45 px-6 py-12 transition-colors hover:border-primary/50 hover:bg-background/65 sm:py-16",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="max-w-md text-center">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-3xl brand-gradient text-white shadow-lg">
            <RiUploadCloud2Line className="h-9 w-9" aria-hidden="true" />
          </div>
          <div className="text-base leading-6 text-muted-foreground">
            <span className="relative rounded-md text-lg font-semibold text-foreground focus-within:outline-none">
              {t("upload_video_cta", "Upload a video file")}
            </span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("upload_dropzone_hint", "Drop a video here or choose a local file.")}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/70 px-3 py-1">
              <FileVideo className="size-3.5" />
              video/*
            </span>
            <span className="rounded-full border border-border/70 bg-card/70 px-3 py-1">Max 2GB</span>
          </div>
        </div>
      </div>

      <Button
        onClick={() => setShowEventInput(true)}
        variant="glass"
        className="relative mx-auto"
      >
        <Link2 className="size-4" />
        {t("Or_enter_existing_video", "Or, enter existing video")}
      </Button>

      {uploadError ? <p className="relative text-center text-sm text-destructive">{uploadError}</p> : null}
    </div>
  );
}
