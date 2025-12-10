import { LoggerAgent } from "@/lib/debug.ts";
import type { SignedEvent } from "@welshman/util/dist/util/src/Events";
import type { NostrWasm } from "nostr-wasm";
import * as nip19 from "nostr-tools/nip19";


const log = LoggerAgent.create("NOSTR_WASM");

// Lazily initialize WebAssembly and store the instance
let nostrWasmInstance: NostrWasm | null = null;

async function getWasmInstance(): Promise<NostrWasm> {
  if (nostrWasmInstance) {
    return nostrWasmInstance;
  }

  log.debug("Initializing WebAssembly");
  const { initNostrWasm } = await import("nostr-wasm");
  nostrWasmInstance = await initNostrWasm();
  return nostrWasmInstance;
}

export async function verifyEvent(event: SignedEvent): Promise<boolean> {
  const nw = await getWasmInstance();
  try {
    nw.verifyEvent(event);
    return true;
  } catch (e) {
    log.error("Event verification failed:", e);
    return false;
  }
}

export interface KeyPair {
  sk: string;
  pk: string;
  privateKey: string;
  publicKey: string;
  formated: string;
}

export async function generatePrivateKey(): Promise<KeyPair> {


  const nw = await getWasmInstance();
  try {
    const sk = nw.generateSecretKey();
    const pk = nw.getPublicKey(sk);
    const privateKey = nip19.nsecEncode(sk);
    const publicKey = nip19.npubEncode(toHex(pk));

    const formated = `Nostr Key
==========

Secret Key (nsec): ${privateKey}
Public Key (npub): ${publicKey}

IMPORTANT: Keep your secret key (nsec) safe and private!
Your public key (npub) should be shared with others so they know who you are on Nostr.

Generated on: ${new Date().toLocaleString()} on ${import.meta.env.VITE_PUBLIC_ROOT_DOMAIN}`;

    return {
      sk: toHex(sk),
      pk: toHex(pk),
      privateKey,
      publicKey,
      formated
    };
  } catch (e) {
    log.error("Private key generation failed:", e);
    throw e;
  }
}

export function toHex(bytes: Uint8Array<ArrayBuffer>): string {
  return bytes.reduce(
    (hex, byte) => hex + byte.toString(16).padStart(2, "0"),
    ""
  );
}

export function fromHex(hex: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(hex.length / 2).map((_, i) =>
    parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  );
}
