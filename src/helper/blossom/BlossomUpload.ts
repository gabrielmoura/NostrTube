import { encodeHex } from "./hex/hex.ts";
import { decodeBase64, encodeBase64 } from "hash-wasm/lib/util.ts";
import { z } from "zod";
import type { NDKImetaTag, NostrEvent } from "./types.ts";

type UploadCallback<T = any> = (data: T) => void;

interface UploadOptions {
  endpoint: string;
  authHeader: string;
}

export interface NostrSigner {
  /** Returns a public key as hex. */
  getPublicKey(): Promise<string>;

  /** Takes an event template, adds `id`, `pubkey` and `sig` and returns it. */
  signEvent(event: Omit<NostrEvent, "id" | "pubkey" | "sig">): Promise<NostrEvent>;

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

const Schema = z.object({
  url: z.string(),
  sha256: z.string(),
  size: z.number(),
  type: z.string().optional(),
  dim: z.string().optional()
});
type schemaType = typeof Schema

export class FileUploader {
  private onSuccessCallback?: UploadCallback<Response>;
  private onProgressCallback?: UploadCallback<number>;
  private onFailedCallback?: UploadCallback<Error>;
  public signer: NostrSigner;

  /**
   * Define o callback de sucesso
   */
  onSuccess(cb: UploadCallback<Response>) {
    this.onSuccessCallback = cb;
    return this;
  }

  /**
   * Define o callback de progresso (0-100)
   */
  onProgress(cb: UploadCallback<number>) {
    this.onProgressCallback = cb;
    return this;
  }

  /**
   * Define o callback de falha
   */
  onFailed(cb: UploadCallback<Error>) {
    this.onFailedCallback = cb;
    return this;
  }

  /**
   * Faz o upload de um arquivo para um endpoint
   */
  private async _upload(file: File, { endpoint, authHeader }: UploadOptions): Promise<schemaType> {
    try {

      const totalSize = file.size;
      let uploaded = 0;

      // Usa um stream customizado para monitorar o progresso
      const stream = file.stream().pipeThrough(
        new TransformStream({
          transform: (chunk, controller) => {
            uploaded += chunk.byteLength;
            const progress = Math.round((uploaded / totalSize) * 100);
            this.onProgressCallback?.(progress);
            controller.enqueue(chunk);
          }
        })
      );

      const response = await fetch(`${endpoint}/upload`, {
        method: "PUT",
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {})
        },
        body: stream
      });

      const json = await response.json();
      const data = Schema.parse(json);


      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      this.onSuccessCallback?.(response);
      return data;
    } catch (error: any) {
      this.onFailedCallback?.(error);
    }
  }

  /**
   * Envia o mesmo arquivo para múltiplos endpoints em paralelo
   */
  async upload(file: File, endpoints: string[]): Promise<schemaType[]> {
    const x = encodeHex(await crypto.subtle.digest("SHA-256", await file.arrayBuffer()));

    const now = Date.now();
    const expiration = now + this.expiresIn;

    const event = await this.signer.signEvent({
      kind: 24242,
      content: `Upload ${file.name}`,
      created_at: Math.floor(now / 1000),
      tags: [
        ["t", "upload"],
        ["x", x],
        ["size", file.size.toString()],
        ["expiration", Math.floor(expiration / 1000).toString()]
      ]
    });
    const authHeader = `Nostr ${N64.encodeEvent(event)}`;

    return await Promise.all(
      endpoints.map((endpoint) =>
        this._upload(file, { endpoint, authHeader })
      )
    );
  }

  private async _mirror(endpoint, authHeader, url: string) {
    try {

      const response = await fetch(`${endpoint}/mirror`, {
        method: "PUT",
        headers: {
          ...(authHeader ? { Authorization: authHeader } : {})
        },
        body: JSON.stringify({ "url": url })
      });
      const json = await response.json();
      const data = Schema.parse(json);


      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      this.onSuccessCallback?.(response);
      return data;
    } catch (error: any) {
      this.onFailedCallback?.(error);
    }

  }

  async mirrorBlob(url: string, endpoints: string[]): Promise<schemaType[]> {
    // /mirror
    const now = Date.now();
    const expiration = now + this.expiresIn;
    const event = await this.signer.signEvent({
      kind: 24242,
      content: `Mirror ${url}`,
      created_at: Math.floor(now / 1000),
      tags: [
        ["t", "mirror"],
        ["expiration", Math.floor(expiration / 1000).toString()]
      ]
    });
    const authHeader = `Nostr ${N64.encodeEvent(event)}`;

    return await Promise.all(
      endpoints.map((endpoint) =>
        this._mirror(endpoint, authHeader, url)
      )
    );
  }

  // Format as NDKImetaTag
  toImeta(data: schemaType[]): NDKImetaTag {
    const primary = data[0];
    const tag: NDKImetaTag = {
      url: primary.url,
      x: primary.sha256,
      size: primary.size?.toString(),
      m: primary.type || "application/octet-stream"
    };
    if (data.length > 1) {
      tag.fallback = data.slice(1).map(d => d.url);
    }
    return tag;
  }
}

export class N64 {
  /** Encode an event as a base64 string. */
  static encodeEvent(event: NostrEvent): string {
    return encodeBase64(JSON.stringify(event));
  }

  /** Decode an event from a base64 string. Validates the event's structure but does not verify its signature. */
  static decodeEvent(base64: string): NostrEvent {
    const bytes = decodeBase64(base64);
    const text = new TextDecoder().decode(bytes);

    return JSON.parse(text);
  }
}