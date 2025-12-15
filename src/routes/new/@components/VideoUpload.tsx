import { lazy } from "react";
import Spinner from "@/components/Spinner.tsx";
import { VideoPlayer } from "@/components/videoPlayer";
import { newVideoStore } from "@/store/videoUploadStore.ts";
import { useSnapshot } from "valtio/react";

const LoadVideoFromOthers = lazy(() => import("@/routes/new/@components/upload/LoadVideosFromOthers.tsx"));
const VideoUploadFile = lazy(() => import("@/routes/new/@components/upload/VideoUploadFile.tsx"));


export default function Player({
                                 url,
                                 title,
                                 image
                               }: {
  url: string;
  title?: string;
  image?: string;
}) {
  if (!url) {
    return (
      <div
        className="center relative aspect-video h-full w-full overflow-hidden rounded-md bg-muted text-primary">
        <Spinner />
      </div>
    );
  }
  return (
    <div className="">
      <VideoPlayer src={url} title={title ?? "Untitled"} thumbnail={image} image={image} />
    </div>
  );
}


export function VideoUpload() {
  const snap = useSnapshot(newVideoStore);

  if (snap.showEventInput) {
    return <LoadVideoFromOthers />;
  }
  return <VideoUploadFile />;
}



