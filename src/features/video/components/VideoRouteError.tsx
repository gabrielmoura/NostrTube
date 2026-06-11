import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import { ErrorFallback } from "@/components/ErrorFallback";
import { logErrorBoundaryError } from "@/features/debug/services/error-log.service.ts";

interface VideoRouteErrorProps {
  error: Error;
}

export function VideoRouteError({ error }: VideoRouteErrorProps) {
  const router = useRouter();

  useEffect(() => {
    logErrorBoundaryError("VideoRouteError", error);
  }, [error]);

  return (
    <ErrorFallback
      variant="page"
      title="Não foi possível carregar este vídeo"
      description={error.message}
      error={error}
      onRetry={() => router.invalidate()}
    />
  );
}
