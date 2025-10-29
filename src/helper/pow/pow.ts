import type {HashedEvent, OwnedEvent} from "@welshman/util"
import {getTag} from "@welshman/util"
import {NDKEvent} from "@nostr-dev-kit/ndk-hooks";
import NDK__default from "@nostr-dev-kit/ndk";

// https://github.com/coracle-social/coracle/blob/master/src/util/pow.ts#L5

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
        "31990:acbf4bb4141163d7fa034b8d4fdcd5bd002916122739150fa1456511c1b4ff76"
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
// export async function _makeEvent({ndk, event, difficulty}: makeEventParams): Promise<NDKEvent> {
//     let preEvent: OwnedEvent
//     event.tags.push([
//         "client",
//         import.meta.env.VITE_APP_NAME,
//         // "31990:266815e0c9210dfa324c6cba3573b14bee49da4209a9456f9484e5106cd408a5:1686066542546"
//     ])
//     if (difficulty) {
//         preEvent = await _calcProof({event, difficulty})
//     } else {
//         preEvent = event
//     }
//     console.log(preEvent, event)
//     const evt = new NDKEvent(ndk, {...preEvent})
//     await evt.sign()
//     return evt
// }

// interface _ProofOfWorkW {
//     event: Partial<HashedEvent>
//     difficulty: number
//     start?: number
//     step?: number
// }
//
//
// function _getPowW(id: Uint8Array<ArrayBufferLike>): number {
//     let count = 0
//
//     for (let i = 0; i < 32; i++) {
//         const nibble = id[i]
//         if (nibble === 0) {
//             count += 8
//         } else {
//             count += Math.clz32(nibble) - 24
//             break
//         }
//     }
//
//     return count
// }