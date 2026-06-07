import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useRef, useState } from "react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { Search, Home, RefreshCw, FileQuestion } from "lucide-react";

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
      <div className="w-full max-w-lg space-y-8 text-center">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
            <FileQuestion className="h-10 w-10 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Vídeo não encontrado</h1>
          <p className="text-muted-foreground">
            Este vídeo pode ter sido removido, ou o link pode estar incorreto.
          </p>
          {eventId && (
            <p className="mt-2 truncate rounded-md bg-muted px-3 py-1.5 text-xs font-mono text-muted-foreground">
              {eventId}
            </p>
          )}
        </div>

        <div className="space-y-3">
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

          <div className="flex gap-3">
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
