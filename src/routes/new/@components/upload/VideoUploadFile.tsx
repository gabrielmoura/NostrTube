import {
    Dispatch,
    SetStateAction,
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { useNDK } from "@nostr-dev-kit/ndk-hooks";
import { useDropzone } from "react-dropzone";
import { NDKBlossom } from "@nostr-dev-kit/ndk-blossom";
import { cn } from "@/helper/format.ts";
import { RiUploadCloud2Line } from "react-icons/ri";
import { Button } from "@/components/button.tsx";
import type { VideoMetadata } from "@/routes/new/@components/VideoUpload.tsx";
import type { NDKImetaTag } from "@nostr-dev-kit/ndk";
import { Card, CardContent } from "@/components/ui/card.tsx";
import { CircleDotDashed } from "lucide-react";
import { Progress } from "@/components/ui/progress.tsx";
import { t } from "i18next";
import { toast } from "sonner";
import {LoggerAgent} from "@/debug.ts";

interface VideoUploadFileProps {
    setShowEventInput: Dispatch<SetStateAction<boolean>>;
    setVideo: Dispatch<SetStateAction<VideoMetadata>>;
}
export default function VideoUploadFile({
                                            setShowEventInput,
                                            setVideo,
                                        }: VideoUploadFileProps) {
    const { ndk } = useNDK();
    const [files, setFiles] = useState<(File & { preview: string })[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [countErrors, setErrosCount] = useState<number>(0);
    const [uploadProgress, setUploadProgress] = useState<number>();
    const logger = LoggerAgent.create("VideoUploadFile")

    // 🔒 Garante referência estável do NDK e upload handler
    const ndkRef = useRef(ndk);
    useEffect(() => {
        ndkRef.current = ndk;
    }, [ndk]);

    const handleUploadFile = useCallback(async (file: File) => {
        const ndkInstance = ndkRef.current;
        if (!ndkInstance) {
            logger.error("NDK instance is not available.");
            return;
        }

        setIsLoading(true);
        const blossom = new NDKBlossom(ndkInstance);
        blossom.debug = import.meta.env.DEV;

        blossom.onUploadFailed = (error, serverUrl, file) => {
            logger.error("Upload failed:", error, serverUrl, file);
            setIsLoading(false);
            setErrosCount((prev) => prev + 1);
            toast.error(
                t("Upload_failed", "Upload failed") + `: ${error.message}`
            );
        };

        blossom.onServerError = (error) => {
            logger.error("Upload failed:", error);
            setIsLoading(false);
            setErrosCount((prev) => prev + 1);
            toast.error(
                t("Upload_failed", "Upload failed") + `: ${error.message}`
            );
        };

        blossom.onUploadProgress = (progress) => {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            if (import.meta.env.DEV) logger.log(`Upload progress: ${percentage}%`);
            setUploadProgress(percentage);
            return "continue";
        };
        blossom.onMirrorProgress = (current, total, sourceUrl) => {
            const percentage = Math.round((current / total) * 100);
            if (import.meta.env.DEV)
                logger.log(
                    `Mirroring progress for ${sourceUrl}: ${percentage}%`
                );
        }

        try {
            const imeta = await blossom.upload(file, {
                fallbackServer:
                    import.meta.env.VITE_NOSTR_BLOSSOM_FALLBACK || undefined,
            });

            logger.log("File uploaded:", imeta);

            const { url, sha256, size, blurhash, dim, m, uploaded, type, owner } =
                imeta;
            const mirrorSet = new Set<NDKImetaTag>();

            for (const url of [import.meta.env.VITE_NOSTR_BLOSSOM_FALLBACK]) {
                const nUrl = await blossom.mirrorBlob(
                    url,
                    import.meta.env.VITE_NOSTR_BLOSSOM_FALLBACK
                );
                logger.log("Mirror Uploaded", nUrl);
                mirrorSet.add(nUrl);
            }

            const newImeta: NDKImetaTag = {
                url,
                sha256,
                size,
                blurhash,
                dim,
                m,
                uploaded,
                type,
                owner,
                fallback: Array.from(mirrorSet)
                    .map((tag) => tag.url)
                    .filter((u) => u !== url),
            };

            setVideo({
                url,
                title: file.name,
                fileType: file.type,
                fileHash: sha256,
                fileSize: size,
                blurhash: blurhash || undefined,
                dim: dim || undefined,
                mime_type: m || undefined,
                imetaVideo: newImeta,
                fallback: Array.from(mirrorSet)
                    .map((tag) => tag.url)
                    .filter((u) => u !== url),
            });

            toast.success("File uploaded");
            setShowEventInput(false);
        } catch (error) {
            logger.error("Error during file upload:", error);
            toast.error("Error during file upload");
        } finally {
            setIsLoading(false);
            // ✅ garante que o arquivo não será reenviado
            setFiles([]);
        }
    }, [setVideo, setShowEventInput]);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            const newFiles = acceptedFiles.map((file) =>
                Object.assign(file, { preview: URL.createObjectURL(file) })
            );
            setFiles(newFiles);

            // ✅ dispara o upload diretamente aqui (controlado, sem depender do useEffect)
            if (newFiles.length > 0) {
                handleUploadFile(newFiles[0]).catch(logger.error);
            }
        },
        [handleUploadFile]
    );

    const { getRootProps, getInputProps } = useDropzone({
        onDrop,
        accept: { "video/*": [] },
    });

    // ✅ Cleanup apenas para revogar previews
    useEffect(() => {
        return () => {
            files.forEach((file) => URL.revokeObjectURL(file.preview));
        };
    }, [files]);

    if (countErrors >= 2) {
        setShowEventInput(false);
        setIsLoading(false);
    }

    if (isLoading && uploadProgress) {
        return (
            <Card
                className={cn(
                    "relative w-full overflow-hidden rounded-lg",
                    "flex flex-col items-center justify-center p-6",
                    "min-h-[200px] md:min-h-[240px]"
                )}
            >
                <CardContent className="flex flex-col items-center justify-center p-0 text-center">
                    <CircleDotDashed className="h-12 w-12 text-muted-foreground animate-spin mb-4" />
                    <p className="text-lg font-semibold mb-2">
                        {t("Sending_files", "Sending files")}... {uploadProgress}%
                    </p>
                    <Progress value={uploadProgress} className="w-[70%] max-w-sm mb-4" />

                    {countErrors > 0 && (
                        <p className="text-sm text-destructive">
                            Foram encontrados {countErrors} erro(s) durante o envio.
                        </p>
                    )}
                    {countErrors === 0 && uploadProgress === 100 && (
                        <p className="text-sm text-green-600">Envio concluído com sucesso!</p>
                    )}
                </CardContent>
            </Card>
        );
    }

    return (
        <div>
            <div
                className={cn(
                    "center relative w-full flex-col gap-y-3 overflow-hidden rounded-md bg-muted aspect-video md:aspect-square h-80 max-h-full"
                )}
            >
                <div
                    {...getRootProps({ className: "dropzone" })}
                    className="mt-2 flex w-full justify-center rounded-lg border border-dashed border-foreground/25 px-6 py-7 hover:bg-background/40 sm:py-10"
                >
                    <input {...getInputProps()} />
                    <div className="text-center">
                        <RiUploadCloud2Line
                            className="mx-auto h-10 w-10 text-muted-foreground sm:h-12 sm:w-12"
                            aria-hidden="true"
                        />
                        <div className="mt-2 flex text-sm leading-6 text-muted-foreground sm:mt-4">
              <span className="relative rounded-md font-semibold text-foreground focus-within:outline-none">
                Upload a file
              </span>
                        </div>
                        <p className="text-xs leading-5 text-muted-foreground">Max 2GB</p>
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
        </div>
    );
}
