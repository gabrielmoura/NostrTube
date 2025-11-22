export declare const ErrorCodes: {
    readonly SERVER_UNAVAILABLE: "SERVER_UNAVAILABLE";
    readonly SERVER_ERROR: "SERVER_ERROR";
    readonly SERVER_REJECTED: "SERVER_REJECTED";
    readonly SERVER_TIMEOUT: "SERVER_TIMEOUT";
    readonly SERVER_LIST_EMPTY: "SERVER_LIST_EMPTY";
    readonly SERVER_INVALID_RESPONSE: "SERVER_INVALID_RESPONSE";
    readonly NO_SIGNER: "NO_SIGNER";
    readonly AUTH_REQUIRED: "AUTH_REQUIRED";
    readonly AUTH_INVALID: "AUTH_INVALID";
    readonly AUTH_EXPIRED: "AUTH_EXPIRED";
    readonly AUTH_REJECTED: "AUTH_REJECTED";
    readonly UPLOAD_TOO_LARGE: "UPLOAD_TOO_LARGE";
    readonly UPLOAD_INVALID_TYPE: "UPLOAD_INVALID_TYPE";
    readonly UPLOAD_FAILED: "UPLOAD_FAILED";
    readonly ALL_SERVERS_FAILED: "ALL_SERVERS_FAILED";
    readonly BLOB_NOT_FOUND: "BLOB_NOT_FOUND";
    readonly USER_SERVER_LIST_NOT_FOUND: "USER_SERVER_LIST_NOT_FOUND";
    readonly SERVER_UNSUPPORTED: "SERVER_UNSUPPORTED";
    readonly FORMAT_UNSUPPORTED: "FORMAT_UNSUPPORTED";
    readonly NO_SHA256_CALCULATOR: "NO_SHA256_CALCULATOR";
};
export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

/** NIP-01 Nostr event. */
export interface NostrEvent {
    /** 32-bytes lowercase hex-encoded sha256 of the serialized event data. */
    id: string;
    /** 32-bytes lowercase hex-encoded public key of the event creator */
    pubkey: string;
    /** Unix timestamp in seconds. */
    created_at: number;
    /** Integer between 0 and 65535. */
    kind: number;
    /** Matrix of arbitrary strings. */
    tags: string[][];
    /** Arbitrary string. */
    content: string;
    /** 64-bytes lowercase hex of the signature of the sha256 hash of the serialized event data, which is the same as the `id` field. */
    sig: string;
}
/**
 * Nostr uploader class.
 *
 * Accepts a file and uploads it according to the implementation.
 * It returns file metadata as [NIP-94](https://github.com/nostr-protocol/nips/blob/master/94.md) tags.
 * The first value is guaranteed to be the public URL of the uploaded file.
 */
export interface NUploader {
    /** Upload the file and get back NIP-94 tags. */
    upload(file: File, opts?: { signal?: AbortSignal }): Promise<[['url', string], ...string[][]]>;
}

/** NIP-07 Nostr signer. */
export interface NostrSigner {
    /** Returns a public key as hex. */
    getPublicKey(): Promise<string>;
    /** Takes an event template, adds `id`, `pubkey` and `sig` and returns it. */
    signEvent(event: Omit<NostrEvent, 'id' | 'pubkey' | 'sig'>): Promise<NostrEvent>;
    /** Returns a record of relay URLs to relay policies. */
    getRelays?(): Promise<Record<string, { read: boolean; write: boolean }>>;
    /** @deprecated NIP-04 crypto methods. Use `nip44` instead. */
    nip04?: {
        /** @deprecated Returns ciphertext and iv as specified in NIP-04. */
        encrypt(pubkey: string, plaintext: string): Promise<string>;
        /** @deprecated Takes ciphertext and iv as specified in NIP-04. */
        decrypt(pubkey: string, ciphertext: string): Promise<string>;
    };
    /** NIP-44 crypto methods. */
    nip44?: {
        /** Returns ciphertext as specified in NIP-44. */
        encrypt(pubkey: string, plaintext: string): Promise<string>;
        /** Takes ciphertext as specified in NIP-44. */
        decrypt(pubkey: string, ciphertext: string): Promise<string>;
    };
}
