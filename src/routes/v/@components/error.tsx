import React, { Component, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";

// Definição dos tipos para Props e State
type Props = {
  /** O conteúdo a ser renderizado normalmente, sem erros. */
  children: ReactNode;
  /** Um componente React opcional para ser exibido como fallback em caso de erro. */
  fallback?: ReactNode;
  /** Uma função opcional a ser executada quando o botão "Voltar ao Início" for clicado. O botão só será exibido se esta prop for fornecida. */
  onGoHome?: () => void;
};

type State = {
  hasError: boolean;
  error: Error | null;
};

/**
 * ErrorBoundaryVideo é um componente que captura erros de JavaScript em seus
 * componentes filhos, registra esses erros e exibe uma UI de fallback.
 */
export class ErrorBoundaryVideo extends Component<Props, State> {
  // Inicializa o estado
  public state: State = {
    hasError: false,
    error: null
  };

  /**
   * Este método de ciclo de vida é chamado após um erro ser lançado por um
   * componente descendente. Ele recebe o erro e deve retornar um valor para
   * atualizar o estado.
   */
  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  /**
   * Este método de ciclo de vida é chamado após um erro ser lançado por um
   * componente descendente. Ele recebe duas informações:
   * - error: O erro que foi lançado.
   * - errorInfo: Um objeto com a chave `componentStack` contendo a trilha
   * de componentes que levaram ao erro.
   */
  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Idealmente, você logaria o erro em um serviço externo aqui
    // Ex: Sentry, LogRocket, DataDog, etc.
    console.error("Uncaught error in <ErrorBoundaryVideo />:", error, errorInfo);
    if (import.meta.env.VITE_BEACON_URL) {
      navigator.sendBeacon(import.meta.env.VITE_BEACON_URL, JSON.stringify(error));
    }
  }

  public render() {
    if (this.state.hasError) {
      // Se uma prop `fallback` for fornecida, renderiza-a.
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Renderiza a UI de fallback padrão com Tailwind CSS.
      return (
        <div
          className="mx-4 my-6 overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-sm"
          role="alert"
        >
          <div className="border-b border-border/60 bg-muted/40 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Não foi possível carregar esta área</h1>
                <p className="text-sm text-muted-foreground">O vídeo pode continuar disponível, mas esta parte da interface encontrou um erro.</p>
              </div>
            </div>
          </div>

          <div className="space-y-5 px-6 py-5">
            <p className="text-sm leading-6 text-muted-foreground">
              Tente recarregar esta seção. Se o problema continuar, volte para a página inicial e abra outro vídeo ou retente mais tarde.
            </p>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={this.handleReload}
                className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                <RefreshCw className="h-4 w-4" />
                Recarregar seção
              </button>
              <Link to={"/"}>
                <button className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
                  <Home className="h-4 w-4" />
                  Voltar ao início
                </button>
              </Link>
            </div>
          </div>

          <details className="mx-6 mb-6 rounded-xl border border-border/60 bg-muted/30 p-4 text-left">
            <summary className="cursor-pointer text-sm font-medium text-foreground hover:text-primary">
              Detalhes técnicos
            </summary>
            <pre className="mt-3 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-background p-3 text-xs text-muted-foreground">
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      );
    }

    // Se não houver erro, renderiza os componentes filhos normalmente.
    return this.props.children;
  }

  /**
   * Função para tentar recarregar a página, oferecendo uma ação para o usuário.
   */
  private handleReload = () => {
    window.location.reload();
  };
}
