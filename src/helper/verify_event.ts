import { logger } from "@/debug.ts";

export function verifyEvent() {
  const log = logger.extend("WASM_VERIFY_EVENT");
  return import("nostr-wasm").then(({ initNostrWasm }) => {
    log("Initializing WebAssembly");

    return initNostrWasm().then((nw) => {
      return nw;
    });
  });
}