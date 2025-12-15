import { useState } from "react";
import { useNDK } from "@nostr-dev-kit/ndk-hooks";
import { nip19 } from "nostr-tools";
import { getTagValue, getTagValues } from "@welshman/util";
import { toast } from "sonner";
import { newVideoStore } from "@/store/videoUploadStore.ts";

export function useVideoImporter() {
  const { ndk } = useNDK();
  const [isImporting, setIsImporting] = useState(false);

  // Lógica 1: Importar de Evento Nostr
  const importFromEvent = async (eventString: string) => {
    if (!eventString.trim() || !ndk) return;

    setIsImporting(true);
    try {
      // Decodificação segura
      let data, type;
      try {
        const decoded = nip19.decode(eventString);
        data = decoded.data;
        type = decoded.type;
      } catch (e) {
        throw new Error("Formato inválido (deve ser nevent ou naddr)");
      }

      if (!["naddr", "nevent"].includes(type)) {
        throw new Error("Tipo não suportado. Use nevent ou naddr.");
      }

      // Construção do Filtro
      const filters: any = { limit: 1 };
      if (data.kind) filters.kinds = [data.kind];
      if (data.pubkey) filters.authors = [data.pubkey];
      if (data.identifier) filters["#d"] = [data.identifier];
      if (data.id) filters.ids = [data.id];

      // Busca
      const eventsSet = await ndk.fetchEvents(filters);
      const event = Array.from(eventsSet)[0];

      if (!event) throw new Error("Evento não encontrado nos relays conectados.");

      // Extração de Dados (Parsing)
      const url = getTagValue("url", event.tags);
      if (!url) throw new Error("Este evento não possui uma tag 'url' válida.");

      const title = getTagValue("title", event.tags) || getTagValue("name", event.tags);
      const summary = getTagValue("summary", event.tags) ?? event.content;
      const thumbnail = getTagValue("thumb", event.tags) || getTagValue("image", event.tags);

      // IMETA Tags
      const imeta = {
        url: url,
        size: Number(getTagValue("size", event.tags)) || undefined,
        m: getTagValue("m", event.tags),
        dim: getTagValue("dim", event.tags),
        blurhash: getTagValue("blurhash", event.tags),
        x: getTagValue("x", event.tags),
        fallback: getTagValues("fallback", event.tags),
        duration: Number(getTagValue("duration", event.tags)) || undefined,
      };

      // Atualização da Store
      newVideoStore.url = url;
      newVideoStore.title = title;
      newVideoStore.summary = summary;
      newVideoStore.thumbnail = thumbnail;
      newVideoStore.imetaVideo = imeta as any;
      newVideoStore.fallback = imeta.fallback;

      toast.success("Vídeo importado com sucesso!");
      newVideoStore.showEventInput = false; // Fecha a tela de importação

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao importar evento");
    } finally {
      setIsImporting(false);
    }
  };

  // Lógica 2: Importar de URL direta
  const importFromUrl = (url: string) => {
    if (!url.trim()) return;

    // Regra de Negócio: YouTube
    if (url.includes("youtu.be") || url.includes("youtube.com")) {
      toast.warning("Links do YouTube podem não funcionar em todos os clientes Nostr.", {
        duration: 5000,
      });

      // Extrair thumbnail do YouTube automaticamente (bônus de UX)
      let videoId = "";
      if (url.includes("youtu.be/")) videoId = url.split("youtu.be/").pop() || "";
      else if (url.includes("v=")) videoId = url.split("v=").pop()?.split("&")[0] || "";

      if (videoId) {
        newVideoStore.thumbnail = `https://i3.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        toast.info("Thumbnail extraída do YouTube automaticamente.");
      }
    }

    newVideoStore.url = url;
    newVideoStore.showEventInput = false;
  };

  return {
    importFromEvent,
    importFromUrl,
    isImporting
  };
}