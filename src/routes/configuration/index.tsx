import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PageSpinner } from '@/components/PageSpinner'
import { Route as rootRoute } from '@/routes/__root'

const ConfigurationPageContent = lazy(() => import('@/routes/configuration/ConfigurationPageContent'))

export const ConfigurationSearchSchema = z.object({
  tab: z.enum(['platform', 'user']).optional(),
  sub: z
    .enum([
      'appearance',
      'player',
      'privacy',
      'privacy-notifications',
      'privacy-visibility',
      'relays-blossom',
      'blossom',
      'imgproxy',
      'corsproxy',
      'dm-relays',
      'presets',
      'profile',
      'account',
      'notifications',
    ])
    .optional(),
})

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/configuration',
  component: RouteComponent,
  validateSearch: ConfigurationSearchSchema,
})

function RouteComponent() {
  const { t } = useTranslation()
  return (
    <ErrorBoundary title={t('page.error_title')}>
      <Suspense
        fallback={
          <PageSpinner
            label={t('page.loading_label')}
            description={t('page.loading_description')}
          />
        }
      >
        <ConfigurationPageContent />
      </Suspense>
    </ErrorBoundary>
  )
}
