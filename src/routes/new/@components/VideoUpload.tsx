import { t } from 'i18next'
import { lazy } from 'react'
import Spinner from '@/components/Spinner.tsx'
import { VideoPlayer } from '@/components/videoPlayer'
import { useVideoUploadStore } from '@/store/videoUpload/useVideoUploadStore.ts'

const LoadVideoFromOthers = lazy(() => import('@/routes/new/@components/upload/LoadVideosFromOthers.tsx'))
const VideoUploadFile = lazy(() => import('@/routes/new/@components/upload/VideoUploadFile.tsx'))

export default function Player({
  url,
  title,
  image,
  mimeType,
}: {
  url: string
  title?: string
  image?: string
  mimeType?: string
}) {
  if (!url) {
    return (
      <div className="center relative aspect-video h-full w-full overflow-hidden rounded-md bg-muted text-primary">
        <Spinner />
      </div>
    )
  }
  return (
    <div className="">
      <VideoPlayer src={url} sourceMimeType={mimeType} title={title ?? t('Untitled', 'Untitled')} image={image ?? ''} />
    </div>
  )
}

export function VideoUpload() {
  const showEventInput = useVideoUploadStore((s) => s.showEventInput)

  if (showEventInput) {
    return <LoadVideoFromOthers />
  }
  return <VideoUploadFile />
}
