import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Download, ExternalLink, FileJson, Flag, ListPlus, MoreVertical, Pencil, Send, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Share } from "@capacitor/share";

// NDK & Utils
import type { NDKEvent } from "@nostr-dev-kit/ndk";
import { useNDKCurrentPubkey } from "@nostr-dev-kit/ndk-hooks";
import { getTagValue } from "@welshman/util";
import { copyText, getVideoDetails } from "@/helper/format.ts";

// Hooks & Store
import { modal } from "@/components/modal_v2/modal-manager.ts";
import { useDownload } from "@/hooks/useDownload.ts";
import { useNostrRetransmission } from "@/hooks/useNostrRetransmission.ts";
import useUserStore from "@/store/useUserStore.ts";

// Components
import AddToPlaylistModal from "@/routes/v/@components/AddToPlaylistModal.tsx";
import { ReportVideoModel } from "@/routes/v/@components/ReportVideoModal.tsx";

const DEFAULT_DOMAIN = "https://nostrtube.com";

export const DropdownMenuVideo = ({ event }: { event: NDKEvent }) => {
  const navigate = useNavigate();
  const npub = useNDKCurrentPubkey();
  const { downloadFile } = useDownload();
  const { forkEvent, retransmitEvent } = useNostrRetransmission();
  const relaysToReetransmit = useUserStore(s => s.config.relays);

  // 1. Extração de dados simplificada
  const { url, title, summary } = getVideoDetails(event);
  const naddr = event.encode();
  const dTag = event.dTag ?? "";
  const isLoggedIn = !!npub;
  const isAuthor = npub === event.author.pubkey;

  // 2. Handlers de Ação
  const actions = {
    handleDownload: () => {
      const promise = downloadFile(url, title);
      toast.promise(promise, {
        success: "Video has been downloaded",
        error: "Video download fail"
      });
    },
    handleShare: async () => {
      const shareUrl = `${import.meta.env.VITE_PUBLIC_ROOT_DOMAIN ?? DEFAULT_DOMAIN}/v/${dTag || naddr}`;

      if (navigator.share) {
        try {
          await Share.share({ title, text: title, url: shareUrl });
        } catch (e) { console.error(e); }
      } else {
        copyText(shareUrl).then(() => toast.success("Link copied!"));
      }
    },
    handleRetransmit: async () => {
      const relays = relaysToReetransmit ?? import.meta.env.VITE_NOSTR_RELAYS;
      const promise = retransmitEvent(event, relays);
      toast.promise(promise, {
        loading: "Retransmitting...",
        success: "Video retransmitted!",
        error: "Failed to retransmit."
      });
    }
  };

  // 3. Definição Declarativa das Opções
  const menuOptions = useMemo(() => {
    const items = [];

    // Opções para usuários logados
    if (isLoggedIn) {
      items.push(
        {
          label: "Retransmit video",
          icon: <Send className="size-4" />,
          action: actions.handleRetransmit
        },
        {
          label: "Fork video",
          icon: <Pencil className="size-4" />,
          action: () => toast.promise(forkEvent(event, 16), {
            loading: "Forking...",
            success: "Video forked!",
            error: "Failed to fork."
          })
        }
      );
    }

    // Opções Gerais
    items.push(
      { label: "Share video", icon: <Share2 className="size-4" />, action: actions.handleShare },
      {
        label: "Add to Playlist",
        icon: <ListPlus className="size-4" />,
        action: () => modal.show(<AddToPlaylistModal eventIdTag={`${event.kind}:${event.pubkey}:${dTag}`} />)
      },
      { label: "Download video", icon: <Download className="size-4" />, action: actions.handleDownload },
      {
        label: "Copy raw event",
        icon: <FileJson className="size-4" />,
        action: () => copyText(JSON.stringify(event.rawEvent())).then(() => toast.success("Copied event"))
      }
    );

    // Opção exclusiva do autor
    if (isAuthor) {
      items.push({
        label: "Edit Event",
        icon: <Pencil className="size-4" />,
        action: () => navigate({
          to: "/v/$eventId",
          params: { eventId: getTagValue("d", event.tags) ?? "" }
        })
      });
    }

    // Opções de Rodapé/Externas
    items.push(
      {
        label: "Report Event",
        icon: <Flag className="size-4 text-red-500" />,
        action: () => modal.show(<ReportVideoModel data={{ title: title || summary[0], eventIdTag: event.tagId(), id: event.id }} />)
      },
      {
        label: "View on NJump",
        icon: <ExternalLink className="size-4" />,
        action: () => window.open(`${import.meta.env.VITE_NJUMP_URL}/${event.id}`, "_blank")
      },
      {
        label: "Open Native",
        icon: <Send className="size-4" />,
        action: () => window.open(`nostr://${naddr}`)
      }
    );

    return items;
  }, [isLoggedIn, actions.handleShare, actions.handleDownload, actions.handleRetransmit, isAuthor, forkEvent, event, dTag, navigate, title, summary, naddr]);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className="inline-flex size-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow-md transition-all hover:bg-gray-100 hover:text-black focus:ring-2 focus:ring-violet-500 outline-none"
          aria-label="Video options"
        >
          <MoreVertical className="size-5" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="min-w-[220px] rounded-lg bg-white p-1.5 shadow-lg ring-1 ring-gray-200 z-50 animate-in fade-in slide-in-from-top-1"
          sideOffset={8}
        >
          {menuOptions.map((option, index) => (
            <DropdownMenu.Item
              key={`${option.label}-${index}`}
              onClick={option.action}
              className="group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-700 outline-none hover:bg-violet-100 hover:text-violet-900 focus:bg-violet-100"
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
  );
};

export default DropdownMenuVideo;