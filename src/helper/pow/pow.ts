import type {HashedEvent, OwnedEvent} from "@welshman/util"
import {getTag} from "@welshman/util"
// https://github.com/coracle-social/coracle/blob/master/src/util/pow.ts#L5
import {createSHA256} from "hash-wasm"
import {bytesToHex} from "@welshman/util/dist/lib/src";
import {NDKEvent} from "@nostr-dev-kit/ndk-hooks";
import NDK__default from "@nostr-dev-kit/ndk";

export interface makeEventParams {
    event: OwnedEvent,
    difficulty?: number,
    ndk: NDK__default
}

export async function makeEvent({ndk, event, difficulty}: makeEventParams): Promise<NDKEvent> {
    let preEvent: OwnedEvent
    event.tags.push([
        "client",
        import.meta.env.VITE_APP_NAME,
        // "31990:266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5:1686066542546"
    ])
    if (difficulty) {
        preEvent = await _calcProof({event, difficulty})
    } else {
        preEvent = event
    }
    console.log(preEvent, event)
    const evt = new NDKEvent(ndk, {...preEvent})
    await evt.sign()
    return evt
}

export async function makeEventJob({ndk, event, difficulty}: makeEventParams): Promise<NDKEvent> {
    let preEvent: OwnedEvent
    event.tags.push([
        "client",
        import.meta.env.VITE_APP_NAME,
        // "31990:266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5:1686066542546"
    ])
    if (difficulty) {
        // preEvent = await _calcProof({event, difficulty})
        const worker = new Worker(new URL("./pow-worker.ts", import.meta.url), {type: "module"});
        preEvent = await new Promise(function (resolve, reject) {
            worker.postMessage({event, difficulty})
            worker.onmessage = (evt) => {
                resolve(evt.data)
            }
            worker.onerror = (err) => reject(err)
            worker.onmessageerror = (err) => reject(err)
        })
    } else {
        preEvent = event
    }
    console.log(preEvent, event)
    const evt = new NDKEvent(ndk, {...preEvent})
    await evt.sign()
    return evt
}

export const getPow = (event: HashedEvent): number => {
    const tag = getTag("nonce", event.tags)!
    const difficulty = parseInt(tag[2])

    if (isNaN(difficulty)) return 0

    let count = 0

    // Convert hex string to array of bytes
    for (let i = 0; i < event.id.length; i += 2) {
        const byte = parseInt(event.id.slice(i, i + 2), 16)
        if (byte === 0) {
            count += 8
        } else {
            count += Math.clz32(byte) - 24
            break
        }
    }

    return count >= difficulty ? difficulty : 0
}

interface _ProofOfWorkW {
    event: OwnedEvent
    difficulty: number
    start?: number
    step?: number
}

async function _calcProof(ev: _ProofOfWorkW): Promise<HashedEvent> {
    const {event, difficulty, start = 0, step = 1} = ev

    let count = start

    const tag = ["nonce", "" + count, "" + difficulty]

    event.tags.push(tag)

    const hasher = await createSHA256()

    while (true) {
        count += step
        tag[1] = count.toString()

        hasher.init()
        hasher.update(
            JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content]),
        )

        const id = hasher.digest("binary")
        const pow = _getPowW(id)

        if (pow >= difficulty) {
            event.id = bytesToHex(id)
            break
        }
    }

    return (event as HashedEvent)
}

function _getPowW(id: Uint8Array<ArrayBufferLike>): number {
    let count = 0

    for (let i = 0; i < 32; i++) {
        const nibble = id[i]
        if (nibble === 0) {
            count += 8
        } else {
            count += Math.clz32(nibble) - 24
            break
        }
    }

    return count
}