import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { z } from 'zod'
import { PageSpinner } from '@/components/PageSpinner'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Route as rootRoute } from '@/routes/__root'

const ConfigurationPageContent = lazy(() => import('@/routes/configuration/ConfigurationPageContent'))

export const ConfigurationSearchSchema = z.object({
  tab: z.enum(['platform', 'user']).optional(),
})

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/configuration',
  component: RouteComponent,
  validateSearch: ConfigurationSearchSchema,
})

function RouteComponent() {
  return (
    <ErrorBoundary title="Não foi possível carregar as configurações">
      <Suspense fallback={<PageSpinner />}>
        <ConfigurationPageContent />
      </Suspense>
    </ErrorBoundary>
  )
}
