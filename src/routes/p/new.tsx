import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { PlaylistForm } from "./@playlist/playlist-form.tsx";
import { toast } from "sonner";

export const Route = createFileRoute("/p/new")({
  component: RouteComponent
});

function RouteComponent() {
  const navigate = useNavigate();

  const handleSuccess = (dTag: string) => {
    // Redireciona para a página de "Meus Vídeos/Playlists" ou para a playlist criada
    // navigate({ to: '/library' }) ou similar

    toast.success("Playlist criada com sucesso! (Redirecionando...)");
    navigate({
      to: "/p/$listId",
      params: { listId: dTag }
    });

  };

  return (
    <div className="container max-w-5xl mx-auto py-10 px-4">
      {/* Navegação simples de volta */}
      <button
        onClick={() => window.history.back()}
        className="flex items-center text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Voltar
      </button>

      {/* Componente encapsulado */}
      <PlaylistForm onSuccess={handleSuccess} />
    </div>
  );
}