import { filter, finalize, fromEvent, map, Observable, takeUntil, takeWhile, tap } from 'rxjs'
import { logger } from '@/lib/debug.ts'
import type { RPCCommandDirectory, RPCMessage, RPCResponse } from './interface'

const log = logger.extend('RPCClient')
const RPC_ID_ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

/**
 * Creates a compact random identifier for correlating RPC request/response messages.
 *
 * The identifier only needs to be unique among in-flight service-worker RPC calls,
 * so a short crypto-backed token is sufficient and avoids a runtime dependency.
 *
 * @param size - Number of characters to include in the generated identifier.
 * @returns A random alphanumeric identifier.
 */
function createRpcId(size = 8): string {
  const bytes = new Uint8Array(size)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (byte) => RPC_ID_ALPHABET[byte % RPC_ID_ALPHABET.length]).join('')
}

/** A client for calling remote methods */
export class RPCClient<Commands extends RPCCommandDirectory = {}> {
  incoming: Observable<RPCResponse>
  outgoing: (message: RPCMessage) => void

  constructor(incoming: Observable<RPCResponse>, outgoing: (message: RPCMessage) => void) {
    this.incoming = incoming
    this.outgoing = outgoing
  }

  /** Call a remote method */
  call<C extends keyof Commands>(command: C, payload: Commands[C]['payload']): Observable<Commands[C]['result']> {
    return new Observable((observer) => {
      const id = createRpcId(8)
      const callLog = log.extend(id)

      callLog('Calling', command, payload)
      this.outgoing({ type: 'CALL', id, command: String(command), payload })

      // Return an observable that listens for the results
      return this.incoming
        .pipe(
          filter((r) => r.id === id),
          tap((r) => callLog('Received', r)),
          takeWhile((r) => r.type !== 'COMPLETE'),
          map((r) => {
            if (r.type === 'ERROR') throw new Error(r.error)
            return r.value
          }),
          takeUntil(fromEvent(window, 'beforeunload')),
          finalize(() => {
            callLog('Closing')
            this.outgoing({ type: 'CLOSE', id })
          }),
        )
        .subscribe(observer)
    })
  }
}
