import {useEffect} from "react";
import {cn} from "@/helper/format.ts";
import useUpload from "@/hooks/useUpload.tsx";
import {Button} from "@/components/button.tsx";
// import {Button} from "@radix-ui/themes";


type ThumbnailProps = {
    url?: string;
    onChange: (video: string) => void;
};
export default function Thumbnail({url, onChange}: ThumbnailProps) {
    const {UploadButton, fileUrl, status} = useUpload({
        folderName: "thumbnails",
    });

    useEffect(() => {
        if (status === "success" && fileUrl) {
            onChange(fileUrl);
        }
    }, [status]);

    if (url) {
        return (
            <div className="">
                <div className={cn("relative overflow-hidden rounded-xl")}>
                    <div className="">
                        <img
                            alt="Image"
                            height="288"
                            width="288"
                            src={url}

                            className={cn(
                                "bg-bckground h-full rounded-xl object-cover object-center",
                            )}
                        />
                    </div>
                    <UploadButton>
                        <Button
                            loading={status === "uploading"}
                            className="absolute right-1 top-1 font-semibold"

                        >
                            Change
                        </Button>
                    </UploadButton>
                </div>
            </div>
        );
    }

    return (
        <UploadButton>
            <Button loading={status === "uploading"}>
                Upload
            </Button>
        </UploadButton>
    );
}
