import { useMemo } from "react";
import { type BlossomServer, MOCK_BLOSSOM_SERVERS } from "@/default.ts";
import { Check, Info, Server } from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader } from "./CommonComponents.tsx";
import useUserStore from "@/store/useUserStore.ts";

export const BlossomSettings = () => {
  const storeDefault = useUserStore((state) => state.blossom.default);
  const storeMirrors = useUserStore((state) => state.blossom.mirrors);
  const setMirrors = useUserStore((state) => state.blossom.setMirrors);
  const setDefault = useUserStore((state) => state.blossom.setDefault);

  const servers = useMemo<BlossomServer[]>(() => MOCK_BLOSSOM_SERVERS, []);
  const primary = storeDefault || servers[0]?.url || "";
  const secondaries = storeMirrors || [];

  const toggleSecondary = (url: string) => {
    if (url === primary) return;
    const nextMirrors = secondaries.includes(url)
      ? secondaries.filter((serverUrl) => serverUrl !== url)
      : [...secondaries, url];
    setMirrors(nextMirrors);
  };

  const handleSetPrimary = (url: string) => {
    const nextMirrors = secondaries.filter((serverUrl) => serverUrl !== url);
    setDefault(url);
    setMirrors(nextMirrors);
  };

  return (
    <Card>
      <CardHeader
        title="Servidores de mídia Blossom"
        description="Escolha onde novos uploads devem ser enviados e quais mirrors ficam como fallback."
        icon={Server}
      />
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs text-zinc-500 uppercase font-bold tracking-wider px-2">
            <span>Servidor</span>
            <span>Função</span>
          </div>

          <div className="h-56 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
            {servers.map((server) => {
              const isPrimary = server.url === primary;
              const isSecondary = secondaries.includes(server.url);

              return (
                <div
                  key={server.url}
                  className={`relative flex items-center justify-between p-3 rounded-lg border transition-all ${isPrimary ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}`}
                >
                  <div className="flex flex-col">
                    <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">{server.name}</span>
                    <span className="text-xs text-zinc-500">{server.region}</span>
                    <span className="text-xs text-zinc-400">{server.url}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPrimary ? (
                      <Badge variant="success" className="flex items-center gap-1">
                        <Check className="w-3 h-3" /> Primário
                      </Badge>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => handleSetPrimary(server.url)}>
                          Definir primário
                        </Button>
                        <div className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-700">
                          <label className="text-xs cursor-pointer select-none" htmlFor={`sec-${server.url}`}>Mirror</label>
                          <input
                            id={`sec-${server.url}`}
                            type="checkbox"
                            checked={isSecondary}
                            onChange={() => toggleSecondary(server.url)}
                            className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-xs text-zinc-400 pt-2 flex items-center gap-1">
            <Info className="w-3 h-3" />
            O servidor primário recebe uploads novos. Mirrors ajudam como fallback quando a origem falhar.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
