import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { PageSpinner } from '@/components/PageSpinner'
import { Route as rootRoute } from '@/routes/__root'

const ConfigurationPageContent = lazy(() => import('@/routes/configuration/ConfigurationPageContent'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/configuration',
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <ConfigurationPageContent />
    </Suspense>
  )
}
