import { type ReactNode, useCallback } from "react";
import { type Accept, useDropzone } from "react-dropzone";
import { CircleDotDashed, UploadCloud } from "lucide-react";
import { t } from "i18next";
import { toast } from "sonner";

import { cn } from "@/helper/format.ts";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { Progress } from "@/components/ui/progress.tsx";
import { AddTagButton } from "@/routes/new/@components/BoxAddToModal.tsx";
import { useBlossomUpload } from "@/hooks/useBlossomUpload.ts";

interface ButtonUploadThumbProps {
  children?: ReactNode;
  setUrl: (url?: string) => void;
  url?: string;
  accept: Accept;
}

export function ButtonUploadThumb({ children, url, setUrl, accept }: ButtonUploadThumbProps) {
  // 1. Integração com o Hook de Lógica
  const { uploadFile, isUploading, progress } = useBlossomUpload({
    onSuccess: (uploadedUrl) => setUrl(uploadedUrl),
    onError: () => setUrl(undefined) // Limpa se falhar
  });

  // 2. Manipulação do Dropzone
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadFile(acceptedFiles[0]);
    }
  }, [uploadFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    multiple: false,
    disabled: isUploading,
    onDropRejected: () => toast.error(t("invalid_file_type", "Invalid file type"))
  });

  // 3. Renderização: Estado de Upload (Loading)
  if (isUploading) {
    return (
      <Card
        className="relative w-full overflow-hidden rounded-lg flex flex-col items-center justify-center p-6 min-h-[150px]">
        <CardContent className="flex flex-col items-center justify-center p-0 text-center w-full">
          <CircleDotDashed className="h-8 w-8 text-primary animate-spin mb-3" />
          <p className="text-sm font-medium mb-2">
            {t("uploading", "Uploading")}... {progress}%
          </p>
          <Progress value={progress} className="w-[80%] h-2" />
        </CardContent>
      </Card>
    );
  }

  // 4. Renderização: Estado com Imagem Já Carregada (Preview)
  if (url) {
    return (
      <div className="relative group w-full overflow-hidden rounded-md border bg-muted">
        {/* O componente pai (NewVideoPage) já lida com o preview grande,
                 mas caso usem este botão isoladamente, mostramos o preview aqui ou apenas o estado.
                 Para seguir o design anterior onde o botão some e vira imagem: */}
        <img
          src={url}
          alt="Thumbnail preview"
          className="w-full h-auto object-cover max-h-[300px]"
        />
        <div
          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button
            onClick={() => setUrl(undefined)}
            className="text-white bg-destructive hover:bg-destructive/90 px-3 py-1 rounded text-sm"
          >
            {t("remove", "Remove")}
          </button>
        </div>
      </div>
    );
  }

  // 5. Renderização: Estado Inicial (Dropzone + URL Input)
  return (
    <div className="flex flex-col gap-3">
      {/* Área de Dropzone */}
      <div
        {...getRootProps()}
        className={cn(
          "cursor-pointer flex flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center transition-colors",
          isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:bg-muted/50",
          !children && "min-h-[120px]"
        )}
      >
        <input {...getInputProps()} />

        {children ? (
          children
        ) : (
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <UploadCloud className="h-8 w-8" />
            <p className="text-sm">
              {isDragActive
                ? t("drop_here", "Drop file here")
                : t("drag_drop_click", "Click or drag file here")}
            </p>
          </div>
        )}
      </div>

      {/* Opção alternativa: Adicionar por URL */}
      <div className="flex items-center gap-2">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground font-medium uppercase">{t("or", "OR")}</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <div className="flex justify-center">
        <AddTagButton
          onAdd={setUrl}
          label="URL"
          placeholder="https://example.com/image.jpg"
          regex={/^https?:\/\/.+/i}
        />
      </div>
    </div>
  );
}