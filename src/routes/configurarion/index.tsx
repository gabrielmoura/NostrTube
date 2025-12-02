import { createFileRoute } from "@tanstack/react-router";
import { BlossomSettings } from "@/routes/configurarion/@components/BlossomSettings.tsx";
import { PermissionSettings } from "@/routes/configurarion/@components/PermissionSettings.tsx";
import { Button } from "@/routes/configurarion/@components/CommonComponents.tsx";
import { RelaySettings } from "@/routes/configurarion/@components/RelaySettings.tsx";
import { useNDKCurrentUser } from "@nostr-dev-kit/ndk-hooks";

export const Route = createFileRoute("/configurarion/")({
  component: RouteComponent
});


function RouteComponent() {
  const currentUser = useNDKCurrentUser();
  if (!currentUser) {
    return (
      <div>
        É necessário estar logado
      </div>
    );
  }
  return (

    <div className="mx-auto space-y-6 px-20  bg-zinc-50 dark:bg-black text-zinc-900 dark:text-zinc-100">

      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">Gerencie sua conexão Nostr e preferências de
          privacidade.</p>
      </div>
      <div className="space-y-6">
        <BlossomSettings />
        <PermissionSettings />
        <RelaySettings />
      </div>
      <div
        className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-black/80 backdrop-blur border-t border-zinc-200 dark:border-zinc-800 flex justify-center sm:static sm:bg-transparent sm:border-0 sm:p-0">
        <Button className="w-full max-w-md shadow-lg sm:shadow-none" size="md">
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}