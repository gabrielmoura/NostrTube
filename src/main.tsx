import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createRouter, RouterProvider } from "@tanstack/react-router";

// Imports locais
import "./i18n";
import "./main.css";
import { routeTree } from "./routeTree.gen";
import { ndkInstance } from "@/lib/ndk";
import { AppProviders, queryClient } from "@/components/AppProviders";
import { printConsoleWarning } from "@/helper/consoleWarning.ts";

// Sentry
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});

// --- Definições de Tipos (Pode mover para src/types.d.ts se preferir) ---
export type RouteAlertType = "success" | "error" | "warning";

interface RouteAlert {
  message: string | string[];
  type: RouteAlertType;
}

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }

  interface HistoryState {
    alert?: RouteAlert;
  }
}
// -----------------------------------------------------------------------

// Setup do Router
const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  scrollRestoration: true,
  context: {
    queryClient,
    ndk: ndkInstance
  }
});

// Renderização
const rootElement = document.getElementById("root") as HTMLElement;
if (import.meta.env.PROD) {
  printConsoleWarning();
}

if (!rootElement.innerHTML) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </StrictMode>
  );
}