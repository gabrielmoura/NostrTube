import { useMemo, useState } from "react";
import { MOCK_BLOSSOM_SERVERS, type BlossomServer } from "@/default";
import { Check, Info, Plus, Server, Trash2 } from "lucide-react";
import { Badge, Button, Card, CardContent, CardHeader } from "./CommonComponents.tsx";
import useUserStore from "@/store/useUserStore.ts";
import { normalizeBlossomServerUrl, testBlossomServer } from "@/features/upload/services/blossom-server.service";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

const EMPTY_LIST: string[] = [];

function describeServer(url: string): BlossomServer & { custom: boolean } {
  try {
    const hostname = new URL(url).hostname;
    return {
      url,
      name: hostname.replace(/^cdn\./, "").replace(/^files\./, "").replace(/^media\./, "").replace(/^blossom\./, "").replace(/\./g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
      region: "Custom",
      custom: true
    };
  } catch {
    return {
      url,
      name: url,
      region: "Custom",
      custom: true
    };
  }
}

function AddBlossomServerDialog() {
  const addCustom = useUserStore((state) => state.blossom.addCustom);
  const setDefault = useUserStore((state) => state.blossom.setDefault);
  const mirrors = useUserStore((state) => state.blossom.mirrors);
  const setMirrors = useUserStore((state) => state.blossom.setMirrors);
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [saveAsPrimary, setSaveAsPrimary] = useState(false);
  const [saveAsMirror, setSaveAsMirror] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentMirrors = mirrors ?? EMPTY_LIST;

  const handleSave = async () => {
    setError(null);
    const normalized = normalizeBlossomServerUrl(url);

    try {
      const parsed = new URL(normalized);
      if (!(parsed.protocol === "https:" || parsed.protocol === "http:")) {
        throw new Error("Use uma URL http(s) válida para o servidor Blossom.");
      }
    } catch {
      setError("Use uma URL http(s) válida para o servidor Blossom.");
      return;
    }

    setIsSaving(true);
    const probe = await testBlossomServer(normalized);
    setIsSaving(false);

    if (!probe.ok) {
      setError(probe.message || "O servidor Blossom não respondeu corretamente.");
      return;
    }

    addCustom(normalized);

    if (saveAsPrimary) {
      setDefault(normalized);
      setMirrors(currentMirrors.filter((entry) => entry !== normalized));
    } else if (saveAsMirror && !currentMirrors.includes(normalized)) {
      setMirrors([...currentMirrors, normalized]);
    }

    setUrl("");
    setSaveAsPrimary(false);
    setSaveAsMirror(true);
    setError(null);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Adicionar servidor
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Novo servidor Blossom</DialogTitle>
          <DialogDescription>
            Validamos o endpoint antes de salvar. Se o teste passar, você pode usá-lo como primário ou mirror.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="blossom-server-url">URL do servidor</Label>
            <Input
              id="blossom-server-url"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                setError(null);
              }}
              placeholder="https://blossom.example.com"
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>
          <div className="space-y-3 rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Definir como primário</p>
                <p className="text-xs text-muted-foreground">Novos uploads de mídia irão primeiro para este servidor.</p>
              </div>
              <Switch checked={saveAsPrimary} onCheckedChange={(checked) => {
                setSaveAsPrimary(checked);
                if (checked) setSaveAsMirror(false);
              }} />
            </div>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Adicionar como mirror</p>
                <p className="text-xs text-muted-foreground">O app tentará BUD-04 e cairá para upload direto se necessário.</p>
              </div>
              <Switch checked={saveAsMirror} onCheckedChange={(checked) => {
                setSaveAsMirror(checked);
                if (checked) setSaveAsPrimary(false);
              }} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button onClick={() => void handleSave()} disabled={!url.trim() || isSaving}>
            {isSaving ? "Testando servidor..." : "Salvar servidor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export const BlossomSettings = () => {
  const storeDefault = useUserStore((state) => state.blossom.default);
  const storeMirrors = useUserStore((state) => state.blossom.mirrors);
  const customServers = useUserStore((state) => state.blossom.custom);
  const setMirrors = useUserStore((state) => state.blossom.setMirrors);
  const setDefault = useUserStore((state) => state.blossom.setDefault);
  const removeCustom = useUserStore((state) => state.blossom.removeCustom);
  const currentMirrors = storeMirrors ?? EMPTY_LIST;
  const currentCustomServers = customServers ?? EMPTY_LIST;
  const primary = normalizeBlossomServerUrl(storeDefault || import.meta.env.VITE_NOSTR_BLOSSOM_FALLBACK || MOCK_BLOSSOM_SERVERS[0]?.url || "");
  const mirrors = useMemo(
    () => Array.from(new Set(currentMirrors.map(normalizeBlossomServerUrl))).filter((url) => url !== primary),
    [currentMirrors, primary]
  );
  const available = useMemo(
    () => Array.from(new Set([
      ...MOCK_BLOSSOM_SERVERS.map((server) => normalizeBlossomServerUrl(server.url)),
      ...currentCustomServers.map(normalizeBlossomServerUrl),
      primary,
      ...mirrors
    ])).filter(Boolean),
    [currentCustomServers, mirrors, primary]
  );

  const servers = useMemo(() => {
    return available
      .map((url) => describeServer(url))
      .sort((left, right) => {
        const leftScore = left.url === primary ? 0 : mirrors.includes(left.url) ? 1 : 2;
        const rightScore = right.url === primary ? 0 : mirrors.includes(right.url) ? 1 : 2;
        if (leftScore !== rightScore) return leftScore - rightScore;
        return left.name.localeCompare(right.name);
      });
  }, [available, mirrors, primary]);

  const toggleSecondary = (url: string) => {
    if (url === primary) return;
    const nextMirrors = currentMirrors.includes(url)
      ? currentMirrors.filter((serverUrl) => serverUrl !== url)
      : [...currentMirrors, url];
    setMirrors(nextMirrors);
  };

  const handleSetPrimary = (url: string) => {
    setDefault(url);
    setMirrors(currentMirrors.filter((serverUrl) => serverUrl !== url));
  };

  return (
    <Card>
      <CardHeader
        title="Servidores de mídia Blossom"
        description="Escolha para onde os uploads vão primeiro e quais servidores entram como fallback nos eventos gerados."
        icon={Server}
      />
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              Primário: <span className="text-zinc-800 dark:text-zinc-100">{primary || "não configurado"}</span>
            </div>
            <AddBlossomServerDialog />
          </div>

          <div className="h-72 space-y-2 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700">
            {servers.map((server) => {
              const isPrimary = server.url === primary;
              const isSecondary = mirrors.includes(server.url);

              return (
                <div
                  key={server.url}
                  className={`relative flex items-center justify-between rounded-xl border p-4 transition-all ${isPrimary ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20" : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{server.name}</span>
                      <Badge variant={server.custom ? "warning" : "outline"}>{server.custom ? "Custom" : server.region}</Badge>
                      {isSecondary && !isPrimary ? <Badge variant="outline">Mirror</Badge> : null}
                    </div>
                    <p className="mt-1 truncate text-xs text-zinc-400">{server.url}</p>
                  </div>

                  <div className="ml-4 flex items-center gap-2">
                    {isPrimary ? (
                      <Badge variant="success" className="flex items-center gap-1">
                        <Check className="h-3 w-3" /> Primário
                      </Badge>
                    ) : (
                      <Button size="sm" variant="ghost" className="text-xs h-7" onClick={() => handleSetPrimary(server.url)}>
                        Definir primário
                      </Button>
                    )}
                    <label className="flex items-center gap-2 border-l border-zinc-200 pl-3 text-xs dark:border-zinc-700">
                      <span>Mirror</span>
                      <input
                        type="checkbox"
                        checked={isSecondary}
                        onChange={() => toggleSecondary(server.url)}
                        disabled={isPrimary}
                        className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </label>
                    {server.custom ? (
                      <Button size="icon" variant="ghost" onClick={() => removeCustom(server.url)} className="text-zinc-500 hover:text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-start gap-2 pt-1 text-xs text-zinc-400">
            <Info className="mt-0.5 h-3 w-3" />
            O app envia primeiro para o primário. Mirrors tentam `PUT /mirror` seguindo BUD-04 e, se falhar, tentam upload direto. Apenas mirrors bem-sucedidos entram como fallbacks nos eventos de vídeo.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
