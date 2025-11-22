import { ErrorCode } from "./types";

/**
 * Base error class for NDK-Blossom
 */
export declare class NDKBlossomError extends Error {
  code: ErrorCode;
  serverUrl?: string;
  cause?: Error;

  constructor(message: string, code: ErrorCode, serverUrl?: string, cause?: Error);
}

/**
 * Error for upload failures
 */
export declare class NDKBlossomUploadError extends NDKBlossomError {
  constructor(message: string, code: ErrorCode, serverUrl?: string, cause?: Error);
}

/**
 * Error for server issues
 */
export declare class NDKBlossomServerError extends NDKBlossomError {
  status?: number;

  constructor(message: string, code: ErrorCode, serverUrl?: string, status?: number, cause?: Error);
}

/**
 * Error for authentication issues
 */
export declare class NDKBlossomAuthError extends NDKBlossomError {
  constructor(message: string, code: ErrorCode, serverUrl?: string, cause?: Error);
}

/**
 * Error for not found issues
 */
export declare class NDKBlossomNotFoundError extends NDKBlossomError {
  constructor(message: string, code: ErrorCode, serverUrl?: string, cause?: Error);
}

/**
 * Error for optimization issues
 */
export declare class NDKBlossomOptimizationError extends NDKBlossomError {
  constructor(message: string, code: ErrorCode, serverUrl?: string, cause?: Error);
}