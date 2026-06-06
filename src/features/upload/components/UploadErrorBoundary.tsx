import React, { Component, type ReactNode } from "react";

type UploadErrorBoundaryProps = {
  children: ReactNode;
};

type UploadErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class UploadErrorBoundary extends Component<UploadErrorBoundaryProps, UploadErrorBoundaryState> {
  public state: UploadErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): UploadErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error) {
    console.error("Uncaught error in <UploadErrorBoundary />:", error);
  }

  public render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-destructive">
        <h2 className="text-lg font-semibold">Nao foi possivel carregar a tela de upload.</h2>
        <p className="mt-2 text-sm">Recarregue a pagina para tentar novamente.</p>
        {this.state.error ? (
          <pre className="mt-4 overflow-auto whitespace-pre-wrap break-words text-xs">
            {this.state.error.toString()}
          </pre>
        ) : null}
      </div>
    );
  }
}
