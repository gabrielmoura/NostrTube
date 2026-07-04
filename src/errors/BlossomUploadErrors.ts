import type { AppErrorContext } from './AppError'
import { DomainError } from './DomainError'
import { SystemError, type SystemErrorSeverity } from './SystemError'

export class BlossomAuthError extends DomainError {
  constructor(message: string, context?: AppErrorContext, options?: ErrorOptions) {
    super(message, 'BLOSSOM_AUTH_REQUIRED', context, options)
  }
}

export class BlossomConfigurationError extends DomainError {
  constructor(message = 'No Blossom server configured', context?: AppErrorContext, options?: ErrorOptions) {
    super(message, 'BLOSSOM_CONFIGURATION_MISSING', context, options)
  }
}

export class BlossomFileTooLargeError extends DomainError {
  constructor(message: string, context?: AppErrorContext, options?: ErrorOptions) {
    super(message, 'BLOSSOM_FILE_TOO_LARGE', context, options)
  }
}

export class BlossomUploadRequirementError extends DomainError {
  constructor(message: string, context?: AppErrorContext, options?: ErrorOptions) {
    super(message, 'BLOSSOM_UPLOAD_REQUIREMENT_FAILED', context, options)
  }
}

export class BlossomDeleteError extends DomainError {
  constructor(message: string, context?: AppErrorContext, options?: ErrorOptions) {
    super(message, 'BLOSSOM_DELETE_INVALID_FILE', context, options)
  }
}

export class BlossomUploadError extends SystemError {
  constructor(
    message: string,
    context?: AppErrorContext,
    options?: ErrorOptions,
    severity: SystemErrorSeverity = 'low',
  ) {
    super(message, 'BLOSSOM_UPLOAD_FAILED', severity, context, options)
  }
}

export class BlossomMirrorError extends SystemError {
  constructor(
    message: string,
    context?: AppErrorContext,
    options?: ErrorOptions,
    severity: SystemErrorSeverity = 'low',
  ) {
    super(message, 'BLOSSOM_MIRROR_FAILED', severity, context, options)
  }
}
