import { createRoute } from '@tanstack/react-router'
import { t } from 'i18next'
import { lazy, Suspense } from 'react'
import { withAuth } from '@/components/AuthGuard.tsx'
import { PageSpinner } from '@/components/PageSpinner'
import { AppShell } from '@/components/layout/AppShell'
import { UploadErrorBoundary } from '@/features/upload/components/UploadErrorBoundary'
import { Route as rootRoute } from '@/routes/__root'

const UploadPageContainer = lazy(async () => {
  const module = await import('@/features/upload/components/UploadPageContainer')
  return { default: module.UploadPageContainer }
})

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/new',
  component: withAuth(NewVideoPage),
  head: () => ({
    meta: [
      { title: t('upload_new_video', 'Upload New Video') },
      {
        name: 'description',
        content: t('upload_desc', 'Upload a new video to NostrTube.'),
      },
      { property: 'og:title', content: t('upload_new_video', 'Upload New Video') },
    ],
  }),
})

function NewVideoPage() {
  return (
    <AppShell activeKey="upload" title={t('upload_new_video', 'Upload New Video')}>
      <UploadErrorBoundary>
        <Suspense fallback={<PageSpinner />}>
          <UploadPageContainer />
        </Suspense>
      </UploadErrorBoundary>
    </AppShell>
  )
}
