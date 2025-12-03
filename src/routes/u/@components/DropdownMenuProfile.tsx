import * as DropdownMenu from "@radix-ui/react-dropdown-menu";

import { Download, MoreVertical } from "lucide-react";
import { useNavigate, useParams } from "@tanstack/react-router";
import { type NDKEvent, NDKUser } from "@nostr-dev-kit/ndk";
import { downloadJsonl } from "@/helper/download.ts";
import { toast } from "sonner";

interface DropdownMenuProfileProps {
  currentUser?: NDKUser; // O usuário logado
  events?: NDKEvent[];
}

interface Option {
  label: string;
  icon: React.ReactNode;
  action: () => Promise<void> | void;
}

export function DropdownMenuProfile({ currentUser, events }: DropdownMenuProfileProps) {
  const navigate = useNavigate();
  const { userId } = useParams({ strict: false });
  const npub = currentUser?.npub!;
  const pubkey = currentUser?.pubkey!;

  const options: Option[] = [
    {
      label: "Export User",
      icon: <Download className="size-4" />,
      action: async () => {
        if (currentUser && events) {
          downloadJsonl(events, `user-${userId || npub}.jsonl`)
            .then(() => toast.success("User data has been downloaded"))
            .catch(() => toast.error("Error downloading user data"));
        }
      }

    }
  ];

  if (currentUser && npub == userId || pubkey == userId) {
    options.push({
      label: "Edit Profile",
      icon: <MoreVertical className="size-4" />,
      action: async () => {
        await navigate({
          to: "/u/$userId/edit",
          params: { userId: npub }
        });
      }
    });
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
  );
}