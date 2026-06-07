import { useRouter } from "@tanstack/react-router";

interface VideoRouteErrorProps {
  error: Error;
}

export function VideoRouteError({ error }: VideoRouteErrorProps) {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl space-y-4 rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-destructive">
      <h1 className="text-lg font-semibold">Nao foi possivel carregar este video.</h1>
      <p className="text-sm">{error.message}</p>
      <button
        type="button"
        className="rounded-lg border border-destructive px-4 py-2 text-sm font-medium transition-colors hover:bg-destructive/10"
        onClick={() => {
          router.invalidate();
        }}
      >
        Tentar novamente
      </button>
    </div>
  );
}
