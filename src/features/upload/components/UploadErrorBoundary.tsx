import React, { type ReactNode } from 'react'
import { ErrorBoundary } from '@/components/ErrorBoundary'

type UploadErrorBoundaryProps = {
  children: ReactNode
}

export function UploadErrorBoundary({ children }: UploadErrorBoundaryProps) {
  return (
    <ErrorBoundary
      title="Não foi possível carregar a tela de upload"
      description="Recarregue a página para tentar novamente."
    >
      {children}
    </ErrorBoundary>
  )
}
