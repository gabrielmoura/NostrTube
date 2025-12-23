import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { RiUploadCloud2Line } from "react-icons/ri";
import { CircleDotDashed } from "lucide-react";
import { toast } from "sonner";
import { t } from "i18next";

import { cn } from "@/helper/format.ts";
import { Button } from "@/components/button.tsx";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { useVideoUploader } from "@/hooks/useVideoUploader.ts";
import { useVideoUploadStore } from "@/store/videoUpload/useVideoUploadStore.ts";

export default function VideoUploadFile() {
  const { upload, isLoading, progress, errorCount } = useVideoUploader();
  // Estado local apenas para preview da imagem/nome antes do upload começar
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const setShowEventInput = useVideoUploadStore((s) => s.setShowEventInput);

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

  // Limpa o preview se houver muitos erros para permitir tentar de novo
  useEffect(() => {
    if (errorCount >= 2) {
      setPreviewFile(null);
    }
  }, [errorCount]);

  if (isLoading) {
    return (
      <Card className="relative w-full overflow-hidden rounded-lg min-h-[240px] flex items-center justify-center p-6">
        <CardContent className="flex flex-col items-center text-center p-0">
          <CircleDotDashed className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
          <p className="text-lg font-semibold mb-2">
            {t("Sending_files", "Sending files")}... {progress}%
          </p>
          <Progress value={progress} className="w-[200px] mb-4" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div
      className="center relative w-full flex-col gap-y-3 overflow-hidden rounded-md bg-muted aspect-video md:aspect-square h-80 max-h-full">
      <div
        {...getRootProps()}
        className={cn(
          "mt-2 flex w-full justify-center rounded-lg border border-dashed border-foreground/25 px-6 py-7 hover:bg-background/40 sm:py-10 cursor-pointer transition-colors",
          isLoading && "opacity-50 cursor-not-allowed"
        )}
      >
        <input {...getInputProps()} />
        <div className="text-center">
          <RiUploadCloud2Line className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
          <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
            <span className="relative rounded-md font-semibold text-foreground focus-within:outline-none">
              {t("upload_video_cta", "Upload a video file")}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Max 2GB</p>
        </div>
      </div>

      <Button
        onClick={() => setShowEventInput(true)}
        variant="ghost"
        className="border-dashed border"
      >
        {t("Or_enter_existing_video", "Or, enter existing video")}
      </Button>
    </div>
  );
}