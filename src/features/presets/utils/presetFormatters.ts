export function shortenPubkey(pubkey: string): string {
  if (pubkey.length <= 16) return pubkey
  return `${pubkey.slice(0, 8)}...${pubkey.slice(-6)}`
}

export function formatPresetDate(timestamp: number): string {
  if (!timestamp) return '-'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp * 1000))
}
