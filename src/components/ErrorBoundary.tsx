import React, { Component, type ReactNode } from "react";
import { ErrorFallback } from "@/components/ErrorFallback";
import type { LucideIcon } from "lucide-react";
import { logErrorBoundaryError } from "@/features/debug/services/error-log.service.ts";

interface ErrorBoundaryProps {
  children: ReactNode;
  variant?: "card" | "page";
  icon?: LucideIcon;
  title?: string;
  description?: string;
  onGoHome?: () => void;
  fallback?: ReactNode | ((error: Error) => ReactNode);
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error in <ErrorBoundary />:", error, errorInfo);
    logErrorBoundaryError("ErrorBoundary", error, errorInfo);
    if (import.meta.env.VITE_BEACON_URL) {
      navigator.sendBeacon(import.meta.env.VITE_BEACON_URL, JSON.stringify(error));
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      const { fallback, variant, icon, title, description, onGoHome } = this.props;
      const error = this.state.error;

      if (fallback) {
        if (typeof fallback === "function") {
          return fallback(error!);
        }
        return fallback;
      }

      return (
        <ErrorFallback
          variant={variant}
          icon={icon}
          title={title ?? "Não foi possível carregar este conteúdo"}
          description={description ?? "Tente recarregar esta seção. Se o problema persistir, volte ao início e tente novamente mais tarde."}
          error={error}
          onRetry={this.handleRetry}
          onGoHome={onGoHome}
        />
      );
    }

    return this.props.children;
  }
}
