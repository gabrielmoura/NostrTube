import { createRoute } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'
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
  return (
    <ErrorBoundary title="Não foi possível carregar as configurações">
      <Suspense
        fallback={
          <PageSpinner label="Carregando configurações" description="Sincronizando preferências locais e opções da plataforma." />
        }
      >
        <ConfigurationPageContent />
      </Suspense>
    </ErrorBoundary>
  )
}
