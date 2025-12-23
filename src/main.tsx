import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createRouter, RouterProvider } from "@tanstack/react-router";

// Imports locais
import "./i18n";
import "./main.css";
import { routeTree } from "./routeTree.gen";
import { ndkInstance } from "@/lib/ndk";
import { AppProviders, queryClient } from "@/components/AppProviders";

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