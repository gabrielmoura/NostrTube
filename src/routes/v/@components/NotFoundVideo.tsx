import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Search, Home, RefreshCw, FileQuestion, ArrowLeft } from "lucide-react";

export function NotFoundVideo() {
  const navigate = useNavigate();
  const { eventId } = useParams({ from: "/v/$eventId" });
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate({ to: "/search", search: { search: searchQuery } as never });
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl border border-border/60 bg-card/95 shadow-sm">
        <div className="border-b border-border/60 bg-muted/40 px-6 py-6 sm:px-8">
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <FileQuestion className="h-8 w-8" />
            </div>
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold tracking-tight">Vídeo não encontrado</h1>
              <p className="text-sm text-muted-foreground">
                O link pode estar incorreto, o vídeo pode ter sido removido ou ainda não ter chegado aos relays conectados.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6 px-6 py-6 sm:px-8">
          {eventId && (
            <p className="truncate rounded-xl border border-border/60 bg-muted/50 px-3 py-2 text-xs font-mono text-muted-foreground">
              {eventId}
            </p>
          )}

          <div className="grid gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 text-left text-sm text-muted-foreground">
            <p>Tente uma destas ações:</p>
            <p>1. Recarregar a página para consultar os relays novamente.</p>
            <p>2. Buscar pelo título, autor ou tag do vídeo.</p>
            <p>3. Voltar para a home e continuar navegando.</p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por título, tag ou autor..."
              className="flex-1"
            />
              <Button type="submit" size="icon">
                <Search className="h-4 w-4" />
              </Button>
          </form>

          <div className="grid gap-3 sm:grid-cols-3">
            <Button variant="outline" className="w-full" onClick={() => window.history.length > 1 ? window.history.back() : navigate({ to: "/" })}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate({ to: "/" })}>
              <Home className="mr-2 h-4 w-4" />
              Início
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => window.location.reload()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
