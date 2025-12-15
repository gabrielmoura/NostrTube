import { useState } from "react";
import { useNDK } from "@nostr-dev-kit/ndk-hooks";
import { nip19 } from "nostr-tools";
import { getTagValue, getTagValues } from "@welshman/util";
import { toast } from "sonner";
import { newVideoStore } from "@/store/videoUploadStore.ts";

export function useNostrVideoSearch() {
  const { ndk } = useNDK();
  const [isSearching, setIsSearching] = useState(false);

  const searchEvent = async (eventTagId: string) => {
    if (!eventTagId || !ndk) return;

    try {
      const { data, type } = nip19.decode(eventTagId);
      if (!["naddr", "nevent"].includes(type)) {
        throw new Error("Invalid format");
      }

      setIsSearching(true);

      const filters: any = { limit: 1 };
      // ... (Lógica de construção de filtro igual ao original) ...
      if (data.kind) filters.kinds = [data.kind];
      if (data.pubkey) filters.authors = [data.pubkey];
      if (data.identifier) filters["#d"] = [data.identifier];
      if (data.id) filters.ids = [data.id];

      const eventsSet = await ndk.fetchEvents(filters);
      const event = Array.from(eventsSet)[0];

      if (event) {
        const url = getTagValues("url", event.tags);
        if (!url) throw new Error("Video URL not found in event");

        const title = getTagValues("title", event.tags) || getTagValues("name", event.tags); // Correção: busca título corretamente
        const summary = getTagValues("summary", event.tags) ?? event.content;
        const thumbnail = getTagValues("thumb", event.tags);
        const image = getTagValues("image", event.tags);
        const fileType = getTagValues("m", event.tags);
        const fileHash = getTagValues("x", event.tags);
        const fileSize = getTagValue("size", event.tags);

        // Atualiza a Store
        newVideoStore.url = url[0]; // Pega o primeiro valor
        newVideoStore.title = title?.[0];
        newVideoStore.summary = summary;
        newVideoStore.thumbnail = thumbnail?.[0] ?? image?.[0];
        // ... mapear o resto do imetaVideo ...

        toast.success("Video loaded successfully");
      } else {
        toast.error("Event not found");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error searching for event");
    } finally {
      setIsSearching(false);
    }
  };

  return { searchEvent, isSearching };
}