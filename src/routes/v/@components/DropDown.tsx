import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { useNavigate } from "@tanstack/react-router";
import { copyText, downloadVideo, getVideoDetails } from "@/helper/format.ts";
import { useNDKCurrentPubkey } from "@nostr-dev-kit/ndk-hooks";
import { getTagValue } from "@welshman/util";
import { Download, ExternalLink, FileJson, Flag, ListPlus, MoreVertical, Pencil, Send, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Share } from "@capacitor/share";
import { modal } from "@/components/modal/state.tsx";


function AddToPlaylistModal({ eventIdentifier }: { eventIdentifier: string }) {
  return <div className="p-4 text-wrap w-full">
    Add to Playlist Modal for event {eventIdentifier} (Demo only)
  </div>;
}


export const DropdownMenuVideo = ({ event }) => {
  const navigate = useNavigate();
  const npub = useNDKCurrentPubkey();
  const rawEvent = event.rawEvent();
  const { url, title } = getVideoDetails(event);
  const naddr = event.encode();

  function handleDownload() {
    downloadVideo(url, title).then(() =>
      toast.success("Video has been downloaded")
    );
  }

  const options = [
    {
      label: "Share video",
      icon: <Share2 className="size-4" />,
      action: () => {

        if (navigator.share) {
          Share.share({
            title: title,
            url: `${
              import.meta.env.VITE_PUBLIC_ROOT_DOMAIN ?? "https://nostrtube.com"
            }/v/${naddr}`
          }).catch(console.log);
        } else {
          copyText(
            `${
              import.meta.env.VITE_PUBLIC_ROOT_DOMAIN ?? "https://nostrtube.com"
            }/v/${naddr}`
          ).then(() => toast.success("Link copied!"));
        }
      }
    },
    {
      label: "Add to Playlist",
      icon: <ListPlus className="size-4" />,
      action: () => {
        modal.show(<AddToPlaylistModal eventIdentifier={event.tagId()} />);
        // toast.info("Demo only: Add to Playlist Modal would open");
      }
    },
    {
      label: "Download video",
      icon: <Download className="size-4" />,
      action: handleDownload
    },
    {
      label: "Copy raw event",
      icon: <FileJson className="size-4" />,
      action: () =>
        copyText(JSON.stringify(rawEvent)).then(() =>
          toast.success("Copied event")
        )
    },
    ...(npub === event.author.pubkey
      ? [
        {
          label: "Edit Event",
          icon: <Pencil className="size-4" />,
          action: async () => {
            await navigate({
              to: "/v/$eventId",
              params: { eventId: getTagValue("d", event.tags) ?? "" }
            });
          }
        }
      ]
      : []),
    {
      label: "Report Event",
      icon: <Flag className="size-4 text-red-500" />,
      action: () => toast.info("Reported! (demo only)")
    },
    {
      label: "View on NJump",
      icon: <ExternalLink className="size-4" />,
      action: () => window.open(`https://njump.me/${event.id}`, "_blank")
    },
    {
      label: "Open Native",
      icon: <Send className="size-4" />,
      action: () => window.open(`nostr://${naddr}`)
    }
  ];

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
  );
};

export default DropdownMenuVideo;
