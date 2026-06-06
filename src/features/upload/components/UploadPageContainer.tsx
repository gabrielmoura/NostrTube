import { VideoUpload } from "@/routes/new/@components/VideoUpload";
import Player from "@/routes/new/@components/VideoUpload";
import { useVideoUploadStore } from "@/store/videoUpload/useVideoUploadStore";
import { usePublishVideo } from "@/hooks/usePublishVideo";
import { UploadFormView } from "@/features/upload/components/UploadFormView";
import { UploadSidebarView } from "@/features/upload/components/UploadSidebarView";

export function UploadPageContainer() {
  const videoData = useVideoUploadStore((state) => state.videoData);
  const setTitle = useVideoUploadStore((state) => state.setTitle);
  const setSummary = useVideoUploadStore((state) => state.setSummary);
  const setContentWarning = useVideoUploadStore((state) => state.setContentWarning);
  const setHashtags = useVideoUploadStore((state) => state.setHashtags);
  const setIndexers = useVideoUploadStore((state) => state.setIndexers);
  const setLanguage = useVideoUploadStore((state) => state.setLanguage);
  const setThumbnail = useVideoUploadStore((state) => state.setThumbnail);
  const saveDraft = useVideoUploadStore((state) => state.saveDraft);

  const { publish, isPending } = usePublishVideo();

  return (
    <div className="flex flex-col gap-8 lg:flex-row py-2.5 px-5">
      <div className="flex-1 min-w-[320px] md:min-w-[500px] space-y-6">
        <div className="w-full overflow-hidden rounded-2xl border bg-background shadow-sm">
          {videoData.url ? (
            <Player
              url={videoData.url}
              title={videoData.title}
              image={videoData.thumbnail}
              mimeType={videoData.mime_type}
            />
          ) : (
            <VideoUpload />
          )}
        </div>
        <UploadFormView
          title={videoData.title}
          summary={videoData.summary}
          contentWarning={videoData.contentWarning}
          onTitleChange={setTitle}
          onSummaryChange={setSummary}
          onContentWarningChange={setContentWarning}
          onHashtagsChange={setHashtags}
          onIndexersChange={setIndexers}
          onLanguageChange={setLanguage}
        />
      </div>
      <UploadSidebarView
        thumbnail={videoData.thumbnail}
        canPublish={Boolean(videoData.url && videoData.title)}
        isPublishing={isPending}
        onThumbnailChange={setThumbnail}
        onSaveDraft={saveDraft}
        onPublish={() => publish(videoData)}
      />
    </div>
  );
}
