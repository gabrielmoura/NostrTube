import {Dispatch, SetStateAction, useCallback, useEffect, useState} from "react";
import {useNDK} from "@nostr-dev-kit/ndk-hooks";
import {useDropzone} from "react-dropzone";
import {NDKBlossom} from "@nostr-dev-kit/ndk-blossom";
import Spinner from "@/components/Spinner.tsx";
import {cn} from "@/helper/format.ts";
import {RiUploadCloud2Line} from "react-icons/ri";
import {Button} from "@/components/button.tsx";
import type {VideoMetadata} from "@/routes/new/@components/VideoUpload.tsx";
import type {NDKImetaTag} from "@nostr-dev-kit/ndk";

interface VideoUploadFileProps {
    setShowEventInput: Dispatch<SetStateAction<boolean>>;
    setVideo: Dispatch<SetStateAction<VideoMetadata>>;
}

export default function VideoUploadFile({setShowEventInput, setVideo}: VideoUploadFileProps) {
    const {ndk} = useNDK();
    const [files, setFiles] = useState<File & { preview: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [countErrors, setErrosCount] = useState<number>(0)

    const onDrop = useCallback((acceptedFiles: File[]) => {
        setFiles(acceptedFiles.map(file => Object.assign(file, {
            preview: URL.createObjectURL(file),
        })));
    }, []);

    const {getRootProps, getInputProps} = useDropzone({
        onDrop,
        // accept: {
        //     'image/*': [] // If you want to accept only images, uncomment this
        // }
    });

    const handleUploadFile = useCallback(async (file: File) => {
        if (!ndk) {
            console.error("NDK instance is not available.");
            return;
        }

        setIsLoading(true);
        const blossom = new NDKBlossom(ndk);
        blossom.debug = import.meta.env.DEV

        blossom.onUploadFailed = (error, serverUrl, file) => {
            console.error("Upload failed:", error, serverUrl, file);
            setIsLoading(false);
            setErrosCount(prev => prev + 1)
        };
        blossom.onServerError = (error) => {
            console.error("Upload failed:", error);
            setIsLoading(false);
            setErrosCount(prev => prev + 1)
        };

        blossom.onUploadProgress = (progress) => {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            console.log(`Upload progress: ${percentage}%`);
            return 'continue';
        };

        try {
            const imeta = await blossom.upload(file, {
                // sha256Calculator: new CalculateHash(),
                fallbackServer: import.meta.env.VITE_NOSTR_BLOSSOM_FALLBACK || undefined,
            });
            console.log('File uploaded:', imeta);

            const {url, sha256, size, blurhash, dim, m,uploaded,type,owner,} = imeta;
            const newImeta :NDKImetaTag= {
                url,
                sha256,
                size,
                blurhash,
                dim,
                m,
                uploaded,
                type,
                owner,
            }

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
            });
            setShowEventInput(false);
        } catch (error) {
            console.error("Error during file upload:", error);
        } finally {
            setIsLoading(false);
        }
    }, [ndk, setVideo, setShowEventInput]);

    useEffect(() => {
        if (files.length > 0 && !isLoading) {
            const fileToUpload = files[0];
            handleUploadFile(fileToUpload).catch(console.error);
        }

        // Cleanup function for object URLs
        return () => {
            files.forEach(file => URL.revokeObjectURL(file.preview));
        };
    }, [files, isLoading, handleUploadFile]);

    if (countErrors >= 2) {
        setShowEventInput(false)
        setIsLoading(false);
    }

    if (isLoading) {
        return (
            <div
                className="center relative w-full overflow-hidden rounded-md bg-muted text-primary aspect-video md:aspect-square  h-80 max-h-full">
                <Spinner/>
            </div>
        );
    }


    return (
        <div className="">
            <div
                className={cn("center relative  w-full flex-col gap-y-3 overflow-hidden rounded-md bg-muted aspect-video md:aspect-square  h-80 max-h-full", {
                    // 'aspect-square': files?.length == 0,
                    // 'aspect-video': files?.length > 0,
                })}
            >
                <div  {...getRootProps({className: 'dropzone'})}
                      className="mt-2 flex w-full justify-center rounded-lg border border-dashed border-foreground/25 px-6 py-7 hover:bg-background/40 sm:py-10">
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

                <Button onClick={() => setShowEventInput(true)} variant="ghost" className='border-dashed border'>
                    Or, enter existing video
                </Button>
            </div>
        </div>
    );
}