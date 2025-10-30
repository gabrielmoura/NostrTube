import {Dispatch, ReactNode, SetStateAction, useCallback, useEffect, useState} from "react";
import {Accept, useDropzone} from "react-dropzone";
import {useNDK} from "@nostr-dev-kit/ndk-hooks";
import {NDKBlossom} from "@nostr-dev-kit/ndk-blossom";
import {Card, CardContent} from "@/components/ui/card.tsx";
import {cn} from "@/helper/format.ts";
import {CircleDotDashed, UploadCloud} from "lucide-react"; // Adicionado UploadCloud para o ícone
import {t} from "i18next";
import {Progress} from "@/components/ui/progress.tsx";
import {Button} from "@/components/ui/button.tsx";
import {AddTagButton} from "@/routes/new/@components/BoxAddToModal.tsx"; // Importe o componente Button se não tiver

interface ButtonUploadProps {
    children: ReactNode
    setUrl: Dispatch<SetStateAction<string>>
    url?: string,
    accept: Accept
}

export default function ButtonUpload({children, url, setUrl, accept}: ButtonUploadProps) {
    const {ndk} = useNDK();
    const [files, setFiles] = useState<(File & { preview: string })[]>([]);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null); // Novo estado para o arquivo a ser enviado
    const [isLoading, setIsLoading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>();

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFiles([Object.assign(acceptedFiles[0], {
                preview: URL.createObjectURL(acceptedFiles[0]),
            })]);
            setFileToUpload(acceptedFiles[0]); // Define o arquivo para ser enviado
        }
    }, []);

    const {getRootProps, getInputProps} = useDropzone({
        onDrop,
        accept,
        multiple: false
    });

    const handleUploadFile = useCallback(async () => { // Removido 'file' como parâmetro, agora usa 'fileToUpload'
        if (!ndk) {
            console.error("NDK instance is not available.");
            return;
        }
        if (!fileToUpload) {
            console.warn("No file selected for upload.");
            return;
        }

        setIsLoading(true);
        setUploadProgress(0); // Resetar o progresso
        const blossom = new NDKBlossom(ndk);
        blossom.debug = import.meta.env.DEV

        blossom.onUploadFailed = (error, serverUrl, file) => {
            console.error("Upload failed:", error, serverUrl, file);
            setIsLoading(false);
            setUploadProgress(undefined);
        };
        blossom.onServerError = (error) => {
            console.error("Upload failed:", error);
            setIsLoading(false);
            setUploadProgress(undefined);
        };

        blossom.onUploadProgress = (progress) => {
            const percentage = Math.round((progress.loaded / progress.total) * 100);
            console.log(`Upload progress: ${percentage}%`);
            setUploadProgress(percentage);
            return 'continue';
        };

        try {
            const imeta = await blossom.upload(fileToUpload, { // Usa fileToUpload
                fallbackServer: import.meta.env.VITE_NOSTR_BLOSSOM_FALLBACK || undefined,
            });
            console.log('File uploaded:', imeta);

            const {url} = imeta;
            setUrl(url)
            setFileToUpload(null); // Limpa o arquivo após o upload bem-sucedido
            setFiles([]); // Limpa a pré-visualização também
        } catch (error) {
            console.error("Error during file upload:", error);
        } finally {
            setIsLoading(false);
            setUploadProgress(undefined);
        }
    }, [ndk, setUrl, fileToUpload]); // Dependência adicionada: fileToUpload

    useEffect(() => {
        // Cleanup function for object URLs
        return () => {
            files.forEach(file => URL.revokeObjectURL(file.preview));
        };
    }, [files]); // Mudei a dependência para apenas 'files'

    if (url) {
        return <img src={url} width={288} alt={""}/>
    }

    if (isLoading && typeof uploadProgress === 'number') { // Verifica se uploadProgress é um número
        return (
            <Card
                className={cn(
                    "relative w-full overflow-hidden rounded-lg",
                    "flex flex-col items-center justify-center p-6",
                    "min-h-[200px] md:min-h-[240px]" // Altura mínima para melhor visualização
                )}
            >
                <CardContent className="flex flex-col items-center justify-center p-0 text-center">
                    <CircleDotDashed className="h-12 w-12 text-muted-foreground animate-spin mb-4"/>
                    <p className="text-lg font-semibold mb-2">
                        {t('Sending_files', 'Sending files')}... {uploadProgress}%
                    </p>
                    <Progress value={uploadProgress} className="w-[70%] max-w-sm mb-4"/>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="flex gap-2 ">
            <div className="flex flex-col items-center gap-4">
                <div {...getRootProps({className: 'dropzone text-center cursor-pointer hover:border-blue-500 transition-colors'})}>
                    <input {...getInputProps()} />
                    {fileToUpload ? (
                        <div className="flex flex-col items-center">
                            <img src={URL.createObjectURL(fileToUpload)} alt="Preview"
                                 className="max-h-48 max-w-full object-contain mb-4 rounded-md"/>
                            <p className="text-sm text-gray-600 mb-2">{fileToUpload.name}</p>
                            <p className="text-sm text-gray-500">{t('File_selected_click_upload_to_send', 'File selected. Click Upload to send.')}</p>
                        </div>
                    ) : (
                        <>
                            {children ? children : (
                                <div className="flex flex-col items-center justify-center min-h-[100px]">
                                    <UploadCloud className="h-10 w-10 text-gray-400 mb-2"/>
                                    <p className="text-gray-500">{t('Drag_and_drop_file_here_or_click_to_select', 'Drag and drop file here, or click to select')}</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
                {fileToUpload && !isLoading && (
                    <Button onClick={handleUploadFile} disabled={isLoading}>
                        {t('Upload_file', 'Upload File')}
                    </Button>
                )}
            </div>
            {!fileToUpload && <AddTagButton
                onAdd={setUrl}
                label="Thumbnail"
                placeholder="https://example.com/thumbnail.jpg"
                regex={/^https?:\/\/.+/i}
            />}
        </div>
    )
}