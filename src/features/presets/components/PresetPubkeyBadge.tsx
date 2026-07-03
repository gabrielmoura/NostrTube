import { Badge } from '@/components/ui/badge'
import { shortenPubkey } from '@/features/presets/utils/presetFormatters'

export function PresetPubkeyBadge({ pubkey }: { pubkey: string }) {
  return (
    <Badge variant="outline" className="font-mono text-[11px]">
      {shortenPubkey(pubkey)}
    </Badge>
  )
}
