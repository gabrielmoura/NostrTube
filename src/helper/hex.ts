/**
 * Converts a byte array to a lowercase hexadecimal string.
 *
 * This replaces the small `bytesToHex` helper previously imported from
 * `@welshman/util` and keeps worker code independent from that package.
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
