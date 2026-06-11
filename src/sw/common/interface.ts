import type { Observable } from 'rxjs'
import type { CachedFile, CacheInfo } from '../worker/cache'
import type { ServiceWorkerErrorLog } from '../worker/error-handler'

// Base RPC message types
export type RPCMessageCall<T = any> = {
  id: string
  type: 'CALL'
  command: string
  payload: T
}
export type RPCMessageClose = {
  id: string
  type: 'CLOSE'
}

// Base RPC response types
export type RPCResponseError = {
  type: 'ERROR'
  id: string
  error: string
}
export type RPCResponseResult<T = any> = {
  type: 'RESULT'
  id: string
  value: T
}
export type RPCResponseComplete = {
  type: 'COMPLETE'
  id: string
}

export type RPCMessage<T = any> = RPCMessageCall<T> | RPCMessageClose
export type RPCResponse<T = any> = RPCResponseError | RPCResponseResult<T> | RPCResponseComplete

// A directory of RPC commands
export type RPCCommandDirectory = {
  [command: string]: {
    payload: any
    result: any
  }
}

// RPC handler function type
export type RPCHandler<TPayload = any, TResult = any> = (
  payload: TPayload,
) => Observable<TResult> | Promise<TResult> | Promise<Observable<TResult>> | TResult

// Registry for RPC handlers
export type RPCHandlerRegistry<Commands extends RPCCommandDirectory = {}> = {
  [command in keyof Commands]: RPCHandler<Commands[command]['payload'], Commands[command]['result']>
}

// Commands for the client to send to the worker
export interface ClientWorkerCommands extends RPCCommandDirectory {
  'errors.getAll': {
    payload: void
    result: ServiceWorkerErrorLog[]
  }
  'errors.clear': {
    payload: void
    result: void
  }
  'errors.getByContext': {
    payload: { context: string }
    result: ServiceWorkerErrorLog[]
  }
  'cache.getAll': {
    payload: void
    result: CacheInfo[]
  }
  'cache.getByName': {
    payload: { cacheName: string }
    result: CachedFile[]
  }
  'cache.clear': {
    payload: { cacheName: string }
    result: void
  }
  'cache.clearAll': {
    payload: void
    result: string[]
  }
  'cache.getStats': {
    payload: void
    result: { totalCaches: number; totalFiles: number; totalSize: number }
  }
  'cache.refresh': {
    payload: void
    result: number
  }
}

// Commands for the worker to send to the client
export interface WorkerClientCommands extends RPCCommandDirectory {
  'worker.ping': {
    payload: void
    result: { pong: boolean }
  }
}
