import { AppError, type ErrorLogLevel } from './AppError'

export abstract class DomainError extends AppError {
  protected override getLogLevel(): ErrorLogLevel {
    return 'warn'
  }
}
