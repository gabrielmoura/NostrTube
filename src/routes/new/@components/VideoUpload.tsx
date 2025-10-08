import {Dispatch, lazy, SetStateAction, useState} from "react";
import Spinner from "@/components/Spinner.tsx";
import {VideoPlayer} from "@/components/videoPlayer";
import {NDKImetaTag} from "@nostr-dev-kit/ndk-hooks";
import {AgeEnum} from "@/store/store/sessionTypes.ts";

const LoadVideoFromOthers = lazy(() => import("@/routes/new/@components/upload/LoadVideosFromOthers.tsx"))
const VideoUploadFile = lazy(() => import("@/routes/new/@components/upload/VideoUploadFile.tsx"))


export default function Player({
                                   url,
                                   title,
                                   image,
                               }: {
    url: string;
    title?: string;
    image?: string;
}) {
    if (!url) {
        return (
            <div
                className="center relative aspect-video h-full w-full overflow-hidden rounded-md bg-muted text-primary">
                <Spinner/>
            </div>
        );
    }
    return (
        <div className="">
            <VideoPlayer src={url} title={title ?? "Untitled"} thumbnail={image} image={image}/>
        </div>
    );
}

export interface VideoMetadata {
    url?: string;
    title?: string;
    summary?: string;
    thumbnail?: string;
    fileType?: string;
    fileHash?: string;
    fileSize?: number;
    duration?: number;
    hashtags?: string;
    contentWarning?: string;
    blurhash?: string;
    dim?: string;
    mime_type?: string;
    imetaVideo: NDKImetaTag
    imetaThumb?: NDKImetaTag
    imetaImage?: NDKImetaTag
    age?: AgeEnum
}

export function VideoUpload({setVideo,}: { setVideo: Dispatch<SetStateAction<VideoMetadata>> }) {
    const [showEventInput, setShowEventInput] = useState(false);
    const [videoUrl, setVideoUrl] = useState("");

    if (showEventInput) {
        return <LoadVideoFromOthers
            setShowEventInput={setShowEventInput}
            videoUrl={videoUrl}
            setVideoUrl={setVideoUrl}
            setVideo={setVideo}
        />
    }
    return <VideoUploadFile setShowEventInput={setShowEventInput} setVideo={setVideo}/>
}



