import React, {Component, type ReactNode} from "react";
import {Link} from "@tanstack/react-router";

// Definição dos tipos para Props e State
type Props = {
    /** O conteúdo a ser renderizado normalmente, sem erros. */
    children: ReactNode;
    /** Um componente React opcional para ser exibido como fallback em caso de erro. */
    fallback?: ReactNode;
    /** Uma função opcional a ser executada quando o botão "Voltar ao Início" for clicado. O botão só será exibido se esta prop for fornecida. */
    onGoHome?: () => void;
    error?: Error
};

type State = {
    hasError: boolean;
    error: Error | null;
};

/**
 * ErrorBoundaryVideo é um componente que captura erros de JavaScript em seus
 * componentes filhos, registra esses erros e exibe uma UI de fallback.
 */
export class ErrorBoundarySearch extends Component<Props, State> {
    // Inicializa o estado
    public state: State = {
        hasError: false,
        error: null,
    };

    /**
     * Este método de ciclo de vida é chamado após um erro ser lançado por um
     * componente descendente. Ele recebe o erro e deve retornar um valor para
     * atualizar o estado.
     */
    public static getDerivedStateFromError(error: Error): State {
        return {hasError: true, error};
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
        navigator.sendBeacon(import.meta.env.VITE_BEACON_URL, JSON.stringify(error))
    }

    public componentDidMount() {
        if (this.props.error) {
            this.state.hasError = true
            this.state.error = this.props.error
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
                    className="flex flex-col items-center justify-center p-6 m-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-lg shadow-md"
                    role="alert"
                >
                    {/* Ícone de Alerta */}
                    <div className="mb-4">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-12 w-12 text-red-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>

                    <h1 className="text-2xl font-bold mb-2">Ops! Algo deu errado.</h1>
                    <p className="text-center text-red-700">
                        Não foi possível carregar este conteúdo. Por favor, tente novamente ou volte ao início.
                    </p>

                    {/* Container para os botões de ação */}
                    <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                        {/* Botão para voltar ao início (condicional) */}
                        <Link to={"/"}>
                            <button

                                className="px-5 py-2.5 bg-transparent border border-red-600 text-red-700 font-semibold rounded-lg shadow-sm hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                            >
                                Voltar ao Início
                            </button>
                        </Link>

                        {/* Botão primário para recarregar a página */}
                        <button
                            onClick={this.handleReload}
                            className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                        >
                            Recarregar Página
                        </button>
                    </div>

                    {/* Opcional: Detalhes do erro em ambiente de desenvolvimento */}
                    {/*{process.env.NODE_ENV === 'development' && this.state.error && (*/}
                    <details className="mt-6 w-full max-w-lg text-left">
                        <summary className="cursor-pointer text-sm font-medium text-red-600 hover:text-red-800">
                            Detalhes do Erro
                        </summary>
                        <pre
                            className="mt-2 p-3 bg-red-100 text-red-900 text-xs rounded-md overflow-auto whitespace-pre-wrap break-all">
                                {this.state.error?.toString()}
                            </pre>
                    </details>
                    {/*)}*/}
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