import { Share } from '@capacitor/share'
import { type NDKEvent, NDKUser } from '@nostr-dev-kit/ndk'
import { useNDK, useNDKCurrentPubkey } from '@nostr-dev-kit/ndk-hooks'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { useNavigate, useParams } from '@tanstack/react-router'
import { Download, MoreVertical, Share2, UserX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { addMuteListItem } from '@/features/nostr/services/mute-list.service'
import { downloadJsonl } from '@/helper/download.ts'
import { copyText } from '@/helper/format.ts'

interface DropdownMenuProfileProps {
  currentUser?: NDKUser // O usuário logado
  targetPubkey?: string
  events?: NDKEvent[]
}

interface Option {
  label: string
  icon: React.ReactNode
  action: () => Promise<void> | void
}

export function DropdownMenuProfile({ currentUser, targetPubkey, events }: DropdownMenuProfileProps) {
  const navigate = useNavigate()
  const { userId } = useParams({ strict: false })
  const { ndk } = useNDK()
  const currentPubkey = useNDKCurrentPubkey()
  const { t } = useTranslation('pages')
  const npub = currentUser?.npub
  const pubkey = currentUser?.pubkey

  const options: Option[] = [
    {
      label: 'Share Profile',
      icon: <Share2 className="size-4" />,
      action: () => {
        if ((navigator as Navigator).share) {
          Share.share({
            title: currentUser?.profile?.name,
            url: `${import.meta.env.VITE_PUBLIC_ROOT_DOMAIN ?? 'https://nostrtube.com'}/u/${npub}`,
          }).catch(console.log)
        } else {
          copyText(`${import.meta.env.VITE_PUBLIC_ROOT_DOMAIN ?? 'https://nostrtube.com'}/u/${npub}`).then(() =>
            toast.success('Link copied!'),
          )
        }
      },
    },
    {
      label: 'Export Profile',
      icon: <Download className="size-4" />,
      action: async () => {
        if (currentUser && events) {
          toast.promise(downloadJsonl(events, `user-${userId || npub}.jsonl`), {
            loading: 'Preparing download...',
            success: 'User data has been downloaded',
            error: 'Error downloading user data',
          })
        }
      },
    },
  ]

  if (targetPubkey && targetPubkey !== currentPubkey) {
    options.push({
      label: 'Mute Profile',
      icon: <UserX className="size-4 text-amber-500" />,
      action: async () => {
        if (!ndk || !currentPubkey) {
          toast.error(t('user_dropdown_login_required'))
          return
        }

        const result = await addMuteListItem({
          ndk,
          pubkey: currentPubkey,
          item: { tagName: 'p', value: targetPubkey },
        })
        toast.success(result.alreadyMuted ? t('user_dropdown_already_muted') : t('user_dropdown_muted_success'))
      },
    })
  }

  if (currentUser && npub && (npub === userId || pubkey === userId)) {
    options.push({
      label: 'Edit Profile',
      icon: <MoreVertical className="size-4" />,
      action: async () => {
        await navigate({
          to: '/u/$userId/edit',
          params: { userId: npub },
        })
      },
    })
  }

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="inline-flex size-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md transition-all hover:bg-gray-100 hover:text-black focus-visible:ring-2 focus-visible:ring-violet-500 focus:outline-none"
          aria-label="Video options"
        >
          <MoreVertical className="size-5" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[220px] rounded-lg bg-white p-1.5 shadow-lg ring-1 ring-gray-200 animate-in fade-in slide-in-from-top-1 z-50"
          sideOffset={8}
          hidden={!currentUser}
        >
          {options.map((option, index) => (
            <DropdownMenu.Item
              key={index}
              onClick={option.action}
              className="group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 outline-none transition-colors hover:bg-violet-100 hover:text-violet-900 focus:bg-violet-100"
            >
              {option.icon}
              <span>{option.label}</span>
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator className="my-1 h-px bg-gray-200" />
          <DropdownMenu.Arrow className="fill-white" />
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
