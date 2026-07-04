import { useNDK, useNDKCurrentUser, useNDKInit, useNDKSessionMonitor } from '@nostr-dev-kit/ndk-hooks'
import { Theme } from '@radix-ui/themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/react'
import { type ReactNode, useEffect } from 'react'
import { Modstr } from '@/components/modal_v2/ModalProvider.tsx'
import OfflineDetector from '@/components/OfflineDetector.tsx'
import { Toaster } from '@/components/ui/sonner'
import { initErrorLogging } from '@/features/debug/services/error-log.service.ts'
import { PresetProvider } from '@/features/presets/context/PresetContext'
import { ndkInstance, sessionStorage } from '@/lib/ndk' // Importe do arquivo criado acima
import { startNdkMessenger } from '@/lib/ndk-messages'

// Configuração do QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

// Wrapper para inicializar NDK e Sessão
function NDKInitializer({ children }: { children: ReactNode }) {
  const initializeNDK = useNDKInit()
  const { ndk } = useNDK()

  useEffect(() => {
    if (!ndk) {
      initializeNDK(ndkInstance)
    }
  }, [ndk, initializeNDK])

  useNDKSessionMonitor(sessionStorage, { follows: true, profile: true })

  return <>{children}</>
}

function NDKMessagingInitializer() {
  const { ndk } = useNDK()
  const currentUser = useNDKCurrentUser()

  useEffect(() => {
    if (!ndk || !currentUser) return
    startNdkMessenger(ndk).catch((error) => {
      console.warn('Failed to start NDK messenger', error)
    })
  }, [currentUser, ndk])

  return null
}

export function AppProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    const cleanup = initErrorLogging()
    return cleanup
  }, [])

  // Protocol Handler Registration
  useEffect(() => {
    if (import.meta.env.PROD && navigator.registerProtocolHandler) {
      try {
        navigator.registerProtocolHandler('web+nostr', new URL('/l/%s', location.origin).toString())
      } catch (e) {
        console.error('Failed to register protocol handler', e)
      }
    }
  }, [])

  return (
    <NDKInitializer>
      <QueryClientProvider client={queryClient}>
        <PresetProvider>
          <Theme>
            <NDKMessagingInitializer />
            {children}
            <Toaster />
            <Modstr />
            <OfflineDetector />
            <Analytics />
            <SpeedInsights />
          </Theme>
        </PresetProvider>
      </QueryClientProvider>
    </NDKInitializer>
  )
}
