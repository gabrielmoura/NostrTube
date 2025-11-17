import {type NDKImetaTag} from "@nostr-dev-kit/ndk";
import {NostrSigner, NUploader} from '@jsr/nostrify__types';
import {encodeHex} from '@jsr/std__encoding/hex';
import { N64 } from '@nostrify/nostrify/utils/N64';

import {z} from 'zod';
/** BlossomUploader options. */
export interface BlossomUploaderOpts {
    /** Blossom servers to use. */
    servers: Request['url'][];
    /** Signer for Blossom authorizations. */
    signer: NostrSigner;
    /** Custom fetch implementation. */
    fetch?: typeof fetch;
    /** Number of milliseconds until each request should expire. (Default: `60_000`) */
    expiresIn?: number;
    /** Callback for upload progress. */
    onProgress?: (progress: number) => void;
    /** Number of retries for failed uploads. (Default: `3`) */
    maxRetries?: number;
}

/** Upload files to Blossom servers. */
export class BlossomUploader implements NUploader {
    private servers: Request['url'][];
    private signer: NostrSigner;
    private fetch: typeof fetch;
    private expiresIn: number;
    private onProgress?: (progress: number) => void;
    private maxRetries: number;

    constructor(opts: BlossomUploaderOpts) {
        if (!opts.servers || opts.servers.length === 0) {
            throw new Error('At least one Blossom server URL must be provided.');
        }
        this.servers = opts.servers;
        this.signer = opts.signer;
        this.fetch = opts.fetch ?? globalThis.fetch.bind(globalThis);
        this.expiresIn = opts.expiresIn ?? 60_000;
        this.onProgress = opts.onProgress;
        this.maxRetries = opts.maxRetries ?? 3;
    }

    async upload(file: File, opts?: { signal?: AbortSignal }): Promise<NDKImetaTag> {
        const x = encodeHex(await crypto.subtle.digest('SHA-256', await file.arrayBuffer()));

        const now = Date.now();
        const expiration = now + this.expiresIn;

        const event = await this.signer.signEvent({
            kind: 24242,
            content: `Upload ${file.name}`,
            created_at: Math.floor(now / 1000),
            tags: [
                ['t', 'upload'],
                ['x', x],
                ['size', file.size.toString()],
                ['expiration', Math.floor(expiration / 1000).toString()],
            ],
        });

        const authorization = `Nostr ${N64.encodeEvent(event)}`;

        const successfulUploads: NDKImetaTag[] = [];
        const failedAttempts: Error[] = [];

        // Distribute mirrors for parallel attempts, but prioritize the first server as primary
        const primaryServer = this.servers[0];
        const mirrorServers = this.servers.slice(1);

        const uploadAttempt = async (server: string, attempt: number = 0): Promise<NDKImetaTag | undefined> => {
            try {
                const url = new URL('/upload', server);

                const response = await this.fetch(url, {
                    method: 'PUT',
                    body: file,
                    headers: {
                        authorization,
                        'content-type': file.type,
                    },
                    signal: opts?.signal,
                    // Implement progress tracking if a custom fetch can expose it
                    // For standard fetch, progress is not directly exposed for request body.
                    // A custom fetch or XMLHttpRequest would be needed for precise progress.
                    // For simplicity, we'll simulate a completion progress here if onProgress is set.
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Upload failed on ${server} with status ${response.status}: ${errorText}`);
                }

                const json = await response.json();
                const data = BlossomUploader.schema().parse(json);

                if (this.onProgress) {
                    this.onProgress(100); // Mark as complete
                }

                return {
                    url: data.url,
                    x: data.sha256,
                    size: data.size.toString(),
                    m: data.type,
                };
            } catch (error) {
                if (attempt < this.maxRetries) {
                    console.warn(`Upload attempt ${attempt + 1} failed on ${server}. Retrying...`, error);
                    return await uploadAttempt(server, attempt + 1);
                }
                throw error; // Propagate error after max retries
            }
        };

        // Try to upload to the primary server first
        let primaryResult: NDKImetaTag | undefined;
        try {
            primaryResult = await uploadAttempt(primaryServer);
            if (primaryResult) {
                successfulUploads.push(primaryResult);
            }
        } catch (error) {
            failedAttempts.push(error as Error);
        }

        // Concurrently try to upload to mirrors
        const mirrorUploadPromises = mirrorServers.map(async (mirror) => {
            try {
                const mirrorResult = await uploadAttempt(mirror);
                if (mirrorResult) {
                    successfulUploads.push(mirrorResult);
                }
            } catch (error) {
                failedAttempts.push(error as Error);
            }
        });

        await Promise.all(mirrorUploadPromises);

        if (successfulUploads.length === 0) {
            const allErrors = failedAttempts.map(err => err.message).join('; ');
            throw new Error(`Failed to upload file to any Blossom server after multiple attempts. Errors: ${allErrors}`);
        }

        // Prioritize the primary server's URL if available, otherwise pick the first successful mirror
        const primaryMeta = successfulUploads.find(meta => meta.url?.startsWith(primaryServer)) || successfulUploads[0];

        const fallbackUrls: string[] = successfulUploads
            .filter(meta => meta.url !== primaryMeta.url)
            .map(meta => meta.url!)
            .filter(Boolean);

        return {
            ...primaryMeta,
            fallback: fallbackUrls.length > 0 ? fallbackUrls : undefined,
        };
    }

    /** Blossom "BlobDescriptor" schema. */
    private static schema() {
        return z.object({
            url: z.string(),
            sha256: z.string(),
            size: z.number(),
            type: z.string().optional(),
        });
    }
}