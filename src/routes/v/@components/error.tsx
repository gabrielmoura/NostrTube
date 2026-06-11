import React, { Component, type ReactNode } from "react";
import { ErrorFallback } from "@/components/ErrorFallback";
import { logErrorBoundaryError } from "@/features/debug/services/error-log.service.ts";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  onGoHome?: () => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundaryVideo extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error in <ErrorBoundaryVideo />:", error, errorInfo);
    logErrorBoundaryError("ErrorBoundaryVideo", error, errorInfo, {
      onGoHome: !!this.props.onGoHome,
    });
    if (import.meta.env.VITE_BEACON_URL) {
      navigator.sendBeacon(import.meta.env.VITE_BEACON_URL, JSON.stringify(error));
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          title="Não foi possível carregar esta área"
          description="O vídeo pode continuar disponível, mas esta parte da interface encontrou um erro."
          error={this.state.error}
          onRetry={this.handleRetry}
          onGoHome={this.props.onGoHome}
          retryLabel="Recarregar seção"
        />
      );
    }

    return this.props.children;
  }
}
