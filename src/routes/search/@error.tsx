import React, { Component, type ReactNode } from 'react'
import { ErrorFallback } from '@/components/ErrorFallback'
import { logErrorBoundaryError } from '@/features/debug/services/error-log.service.ts'

type Props = {
  children: ReactNode
  fallback?: ReactNode
  onGoHome?: () => void
  error?: Error
}

type State = {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundarySearch extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in <ErrorBoundarySearch />:', error, errorInfo)
    logErrorBoundaryError('ErrorBoundarySearch', error, errorInfo)
    if (import.meta.env.VITE_BEACON_URL) {
      navigator.sendBeacon(import.meta.env.VITE_BEACON_URL, JSON.stringify(error))
    }
  }

  public componentDidMount() {
    if (this.props.error) {
      this.setState({ hasError: true, error: this.props.error })
      logErrorBoundaryError('ErrorBoundarySearch', this.props.error)
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <ErrorFallback
          variant="page"
          title="Ops! Algo deu errado."
          description="Não foi possível carregar este conteúdo. Por favor, tente novamente ou volte ao início."
          error={this.state.error}
          onRetry={this.handleRetry}
          onGoHome={this.props.onGoHome}
        />
      )
    }

    return this.props.children
  }
}
