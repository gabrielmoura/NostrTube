/**
 * Converts a byte array to a lowercase hexadecimal string.
 *
 * This keeps worker code independent from broad utility packages when only a
 * small hexadecimal formatter is needed.
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}
