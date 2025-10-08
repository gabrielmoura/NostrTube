import {Dispatch, ReactNode, SetStateAction, useCallback, useEffect, useState} from "react";
import {useDropzone} from "react-dropzone";
import {useNDK} from "@nostr-dev-kit/ndk-hooks";
import {NDKBlossom} from "@nostr-dev-kit/ndk-blossom";

interface ButtonUploadProps{
    children:ReactNode
    setUrl:Dispatch<SetStateAction<string>>
    url?:string
}
export default function ButtonUpload({children,url,setUrl}:ButtonUploadProps){
    const {ndk} = useNDK();
    const [files, setFiles] = useState<File & { preview: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
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

        };
        blossom.onServerError = (error) => {
            console.error("Upload failed:", error);
            setIsLoading(false);

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

            const {url, sha256, size, blurhash, dim, m} = imeta;

            setUrl(url)
        } catch (error) {
            console.error("Error during file upload:", error);
        } finally {
            setIsLoading(false);
        }
    }, [ndk, setUrl]);

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

    if (url){
        return  <img src={url} width={288} alt={""} />
    }

    return (
        <div  {...getRootProps({className: 'dropzone'})}>
            <input {...getInputProps()} />
            {children}
        </div>
    )
}