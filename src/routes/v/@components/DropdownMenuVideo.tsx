import type { NDKEvent } from '@nostr-dev-kit/ndk'
import { VideoMenuDropdown } from '@/features/video/components/VideoMenuDropdown'

export const DropdownMenuVideo = ({ event }: { event: NDKEvent }) => {
  return <VideoMenuDropdown event={event} />
}

export default DropdownMenuVideo
