import {BlossomClient} from "blossom-client-sdk/client";
import {getEventHash} from "nostr-tools/pure";
import type {EventTemplate} from "blossom-client-sdk";
import type {UnsignedEvent} from "nostr-tools/core";
import NDK__default, {type NDKImetaTag} from "@nostr-dev-kit/ndk";

interface uploafFile {
    file: File,
    server: string
    mirrors: string[]
}

export function useBlossomUpload({ndk}: { ndk: NDK__default }) {
    let progress = 0;

    const signer = async (draft: EventTemplate) => {
        // add the pubkey to the draft event
        const event: UnsignedEvent = {...draft, pubkey: user.pubkey};
        // get the signature
        const sig = await ndk.signer!.sign(event);

        // return the event + id + sig
        return {...event, sig, id: getEventHash(event)};
    };

    async function upload({file, server, mirrors}: uploafFile): Promise<NDKImetaTag> {

        const uploadAuth = await BlossomClient.createUploadAuth(signer, "upload", {
            message: "Upload Blob" + file.name,
            expiration: 60 * 5 // 5 minutes
        });

        const tag = await BlossomClient.uploadBlob(server, file, {
            auth: uploadAuth,
        });
        const mirrorSet = new Set();
        for (const mirror of mirrors) {
            mirrorSet.add(mirror);
            BlossomClient.mirrorBlob(mirror, tag, {
                auth: uploadAuth,
            }).then(r => mirrorSet.add(r.url)).catch(e => console.error("Mirroring failed:", e));
        }

        const nTag: NDKImetaTag = {
            url: tag.url,
            alt: file.name,
            m: file.type,
            x: tag.sha256,
            size: tag.size.toString(),
            fallback: Array.from(mirrorSet).filter(url => url !== tag.url)
        }
        return nTag;
    }


    return {
        upload,
        onProgress: progress,
    };
}