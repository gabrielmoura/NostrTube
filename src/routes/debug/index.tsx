import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { PageSpinner } from '@/components/PageSpinner'
import { Route as rootRoute } from '@/routes/__root'

const DebugPageContent = lazy(() => import('@/routes/debug/DebugPageContent'))

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/debug',
  component: DebugPage,
})

function DebugPage() {
  return (
    <ErrorBoundary title="Não foi possível carregar a página de debug">
      <Suspense
        fallback={
          <PageSpinner
            label="Carregando diagnóstico"
            description="Preparando ferramentas de inspeção e estado da aplicação."
          />
        }
      >
        <DebugPageContent />
      </Suspense>
    </ErrorBoundary>
  )
}
