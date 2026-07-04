import { describe, expect, it } from 'vitest'
import {
  BlossomAuthError,
  BlossomConfigurationError,
  BlossomUploadError,
  DvmEncryptionUnavailableError,
  ThumbnailCanvasError,
  VideoEventBuildError,
} from '@/errors'
import { DomainError } from './DomainError'
import { SystemError } from './SystemError'

describe('upload error classes', () => {
  it('keeps expected upload flow errors as domain errors', () => {
    expect(new BlossomAuthError('login')).toBeInstanceOf(DomainError)
    expect(new BlossomConfigurationError()).toBeInstanceOf(DomainError)
    expect(new VideoEventBuildError('missing title')).toBeInstanceOf(DomainError)
    expect(new DvmEncryptionUnavailableError('missing nip04')).toBeInstanceOf(DomainError)
  })

  it('keeps technical upload failures as system errors with low severity by default', () => {
    const uploadError = new BlossomUploadError('server failed', { server: 'https://example.com' })
    const thumbnailError = new ThumbnailCanvasError()

    expect(uploadError).toBeInstanceOf(SystemError)
    expect(uploadError.severity).toBe('low')
    expect(uploadError.toLogPayload().level).toBe('info')
    expect(thumbnailError).toBeInstanceOf(SystemError)
    expect(thumbnailError.severity).toBe('low')
  })

  it('supports medium severity for final failed uploads', () => {
    const error = new BlossomUploadError('all servers failed', { uploadErrors: ['a', 'b'] }, undefined, 'medium')

    expect(error.severity).toBe('medium')
    expect(error.toLogPayload().level).toBe('warn')
  })
})
