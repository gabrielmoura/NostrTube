import { type ReactNode, useEffect } from "react";
import { Theme } from "@radix-ui/themes";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import { Modstr } from "@/components/modal_v2/ModalProvider.tsx";
import OfflineDetector from "@/components/OfflineDetector.tsx";
import { useNDK, useNDKInit, useNDKSessionMonitor } from "@nostr-dev-kit/ndk-hooks";
import { ndkInstance, sessionStorage } from "@/lib/ndk"; // Importe do arquivo criado acima

// Configuração do QueryClient
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Wrapper para inicializar NDK e Sessão
function NDKInitializer({ children }: { children: ReactNode }) {
  const initializeNDK = useNDKInit();
  const { ndk } = useNDK();

  useEffect(() => {
    if (!ndk) {
      initializeNDK(ndkInstance);
    }
  }, [ndk, initializeNDK]);

  useNDKSessionMonitor(sessionStorage, { follows: true, profile: true });

  return <>{children}</>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  // Protocol Handler Registration
  useEffect(() => {
    if (import.meta.env.PROD && navigator.registerProtocolHandler) {
      try {
        navigator.registerProtocolHandler("web+nostr", new URL("/l/%s", location.origin).toString());
      } catch (e) {
        console.error("Failed to register protocol handler", e);
      }
    }
  }, []);

  return (
    <HelmetProvider>
      <NDKInitializer>
        <QueryClientProvider client={queryClient}>
          <Theme>
            {children}
            <Toaster />
            <Modstr />
            <OfflineDetector />
            <Analytics />
            <SpeedInsights />
          </Theme>
        </QueryClientProvider>
      </NDKInitializer>
    </HelmetProvider>
  );
}