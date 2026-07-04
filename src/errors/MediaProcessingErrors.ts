import type { AppErrorContext } from './AppError'
import { DomainError } from './DomainError'
import { SystemError, type SystemErrorSeverity } from './SystemError'

export class VideoEventBuildError extends DomainError {
  constructor(message: string, context?: AppErrorContext, options?: ErrorOptions) {
    super(message, 'VIDEO_EVENT_BUILD_INVALID_DRAFT', context, options)
  }
}

export class DvmConfigurationError extends DomainError {
  constructor(message: string, context?: AppErrorContext, options?: ErrorOptions) {
    super(message, 'DVM_CONFIGURATION_INVALID', context, options)
  }
}

export class DvmEncryptionUnavailableError extends DomainError {
  constructor(message: string, context?: AppErrorContext, options?: ErrorOptions) {
    super(message, 'DVM_ENCRYPTION_UNAVAILABLE', context, options)
  }
}

export class MediaProcessingError extends SystemError {
  constructor(
    message: string,
    context?: AppErrorContext,
    options?: ErrorOptions,
    severity: SystemErrorSeverity = 'low',
  ) {
    super(message, 'MEDIA_PROCESSING_FAILED', severity, context, options)
  }
}

export class ThumbnailCanvasError extends MediaProcessingError {
  constructor(message = 'Unable to create thumbnail canvas context', context?: AppErrorContext, options?: ErrorOptions) {
    super(message, context, options)
    this.name = 'ThumbnailCanvasError'
  }
}

export class ThumbnailGenerationError extends MediaProcessingError {
  constructor(message: string, context?: AppErrorContext, options?: ErrorOptions) {
    super(message, context, options)
    this.name = 'ThumbnailGenerationError'
  }
}
