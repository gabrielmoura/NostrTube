import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";
import { withAuth } from "@/components/AuthGuard.tsx";
import { UploadPageContainer } from "@/features/upload/components/UploadPageContainer";
import { UploadErrorBoundary } from "@/features/upload/components/UploadErrorBoundary";

export const Route = createFileRoute("/new/")({
  component: withAuth(NewVideoPage),
  head: () => ({
    meta: [
      { title: t("upload_new_video", "Upload New Video") },
      {
        name: "description",
        content: t("upload_desc", "Upload a new video to NostrTube.")
      },
      { property: "og:title", content: t("upload_new_video", "Upload New Video") }
    ]
  })
});


function NewVideoPage() {
  return (
    <UploadErrorBoundary>
      <UploadPageContainer />
    </UploadErrorBoundary>
  );
}
