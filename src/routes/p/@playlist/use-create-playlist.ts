import { useState, useTransition } from "react";
import type { PlaylistFormData } from "./types";
import { makeEvent } from "@/helper/pow/pow.ts";
import { nostrNow } from "@/helper/date.ts";
import NDK__default, { NDKKind } from "@nostr-dev-kit/ndk";
import { ulid } from "ulid";

interface PlaylistConfigProps {
  ndk: NDK__default;
  pubkey: string;
}

// STUB: Função de criação do evento Nostr
// Esta função deve criar um evento kind:30001 (NIP-51) ou similar
const createNostrPlaylistEvent = async ({
                                          name,
                                          description,
                                          coverImage
                                        }: PlaylistFormData, { ndk, pubkey }: PlaylistConfigProps): Promise<string> => {
  const newDTag = `${import.meta.env.VITE_APP_NAME}-playlist-${ulid()}`;

  const event = await makeEvent({
    difficulty: 10,
    event: {
      created_at: nostrNow(),
      kind: NDKKind.VideoCurationSet,
      content: description || "",
      tags: [
        ["title", name],
        ["d", newDTag],
        ["description", description || ""],
        ...(coverImage ? [["image", coverImage]] : [])
      ],
      pubkey
    },
    ndk: ndk
  });

  await event.publish();

  console.log("Simulando criação de playlist no Nostr...", event);
  return newDTag;
};

interface useCreatePlaylistProps extends PlaylistConfigProps {
  onSuccess?: (id: string) => void;
}

export function useCreatePlaylist({ onSuccess, pubkey, ndk }: useCreatePlaylistProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (data: PlaylistFormData) => {
    setError(null);
    startTransition(async () => {
      try {
        const playlistId = await createNostrPlaylistEvent(data, { pubkey, ndk });
        if (onSuccess) onSuccess(playlistId);
      } catch (err) {
        console.error(err);
        setError("Falha ao publicar a playlist. Tente novamente.");
      }
    });
  };

  return {
    submit: handleSubmit,
    isPending,
    error
  };
}