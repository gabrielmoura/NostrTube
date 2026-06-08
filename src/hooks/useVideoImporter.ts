import { useState } from "react";
import { useNDK } from "@nostr-dev-kit/ndk-hooks";
import { nip19 } from "nostr-tools";
import { getTagValue, getTagValues } from "@welshman/util";
import { toast } from "sonner";
import { useVideoUploadStore } from "@/store/videoUpload/useVideoUploadStore.ts";
import { normalizeVideoEventAssets } from "@/features/video/services/video-imeta.service";
import { generateVideoThumbnailFromUrl } from "@/features/upload/services/local-media-processing.service";
import { fetchVideoEventByReference } from "@/features/nostr/services/ndk-query.service";
import { uploadToConfiguredBlossomServers } from "@/features/upload/services/blossom-server.service";

export function useVideoImporter() {
  const { ndk } = useNDK();
  const [isImporting, setIsImporting] = useState(false);
  const setVideoUpload = useVideoUploadStore((s) => s.setVideoUpload);
  const setShowEventInput = useVideoUploadStore((s) => s.setShowEventInput);
  const setUrl = useVideoUploadStore((s) => s.setUrl);
  const setThumbnail = useVideoUploadStore((s) => s.setThumbnail);
  const setVideoData = useVideoUploadStore((s) => s.setVideoData);

  // Lógica 1: Importar de Evento Nostr
  const importFromEvent = async (eventString: string) => {
    if (!eventString.trim() || !ndk) return;

    setIsImporting(true);
    try {
      // Decodificação segura
      let data: nip19.AddressPointer | nip19.EventPointer;
      let type: "naddr" | "nevent";
      try {
        const decoded = nip19.decode(eventString);
        if (decoded.type !== "naddr" && decoded.type !== "nevent") {
          throw new Error("Tipo não suportado. Use nevent ou naddr.");
        }
        data = decoded.data as nip19.AddressPointer | nip19.EventPointer;
        type = decoded.type;
      } catch (e) {
        throw new Error("Formato inválido (deve ser nevent ou naddr)");
      }

      const event = await fetchVideoEventByReference(ndk, eventString, { mode: "parallel" });

      if (!event) throw new Error("Evento não encontrado nos relays conectados.");

      // Extração de Dados (Parsing)
      const title = getTagValue("title", event.tags) || getTagValue("name", event.tags);
      const summary = getTagValue("summary", event.tags) ?? event.content;
      const thumbnail = getTagValue("thumb", event.tags) || getTagValue("image", event.tags);
      const assetSet = normalizeVideoEventAssets(event.tags);
      const primaryVariant = assetSet.variants[0];
      const url = primaryVariant?.candidates[0]?.url ?? getTagValue("url", event.tags);
      if (!url) throw new Error("Este evento nao possui nenhuma fonte de video reproduzivel.");

      // IMETA Tags
      const imeta = {
        url: primaryVariant?.candidates[0]?.url ?? url,
        size: Number(getTagValue("size", event.tags)) || undefined,
        m: primaryVariant?.mimeType ?? getTagValue("m", event.tags),
        dim: primaryVariant?.dimension ?? getTagValue("dim", event.tags),
        blurhash: getTagValue("blurhash", event.tags),
        x: primaryVariant?.hash ?? getTagValue("x", event.tags),
        fallback: primaryVariant?.candidates.slice(1).map((candidate) => candidate.url) ?? getTagValues("fallback", event.tags),
        duration: primaryVariant?.duration ?? (Number(getTagValue("duration", event.tags)) || undefined)
      };

      // Atualização da Store
      setVideoUpload({
        url: primaryVariant?.candidates[0]?.url ?? url,
        title,
        summary,
        thumbnail: primaryVariant?.posterUrls[0] ?? thumbnail,
        mime_type: primaryVariant?.mimeType,
        imetaVideo: imeta as any,
        imetaVariants: assetSet.variants.map((variant) => ({
          url: variant.candidates[0]?.url,
          m: variant.mimeType,
          dim: variant.dimension,
          x: variant.hash,
          blurhash: variant.blurhash,
          duration: variant.duration?.toString(),
          bitrate: variant.bitrate?.toString(),
          image: variant.posterUrls[0],
          fallback: variant.candidates.slice(1).map((candidate) => candidate.url)
        } as any)),
        imetaAudioTracks: assetSet.audioTracks.map((track) => ({
          url: track.candidates[0]?.url,
          m: track.mimeType,
          l: track.language ? `${track.language}${track.isOriginalVersion ? " ISO-639-1 ov" : " ISO-639-1"}` : undefined,
          waveform: track.waveform,
          duration: track.duration?.toString(),
          bitrate: track.bitrate?.toString(),
          fallback: track.candidates.slice(1).map((candidate) => candidate.url)
        } as any)),
        fallback: imeta.fallback,
        origin: {
          platform: "nostr",
          externalId: event.id,
          originalUrl: eventString,
          metadata: event.kind.toString()
        }
      });

      toast.success("Vídeo importado com sucesso!");
      setShowEventInput(false);

    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao importar evento");
    } finally {
      setIsImporting(false);
    }
  };

  // Lógica 2: Importar de URL direta
  const importFromUrl = async (url: string) => {
    if (!url.trim()) return;

    // Regra de Negócio: YouTube
    if (url.includes("youtu.be") || url.includes("youtube.com")) {
      toast.warning("Links do YouTube podem não funcionar em todos os clientes Nostr.", {
        duration: 5000
      });

      // Extrair thumbnail do YouTube automaticamente (bônus de UX)
      let videoId = "";
      if (url.includes("youtu.be/")) videoId = url.split("youtu.be/").pop() || "";
      else if (url.includes("v=")) videoId = url.split("v=").pop()?.split("&")[0] || "";

      if (videoId) {
        setThumbnail(`https://i3.ytimg.com/vi/${videoId}/hqdefault.jpg`);
        toast.info("Thumbnail extraída do YouTube automaticamente.");
      }
    }

    let generatedThumbnail: string | undefined;
    const mimeType = inferMimeTypeFromUrl(url);

    if (ndk && mimeType?.startsWith("video/")) {
      try {
        const generated = await generateVideoThumbnailFromUrl(url, url.split("/").pop()?.split("?")[0] || "external-video");
        const thumbnailUpload = await uploadToConfiguredBlossomServers({
          ndk,
          file: generated.file,
          label: "external-video-thumbnail"
        });
        generatedThumbnail = thumbnailUpload.url;
        if (generatedThumbnail) {
          setThumbnail(generatedThumbnail);
        }
        toast.success("Thumbnail gerada a partir do vídeo externo.");
      } catch (error) {
        console.warn("External thumbnail generation failed", error);
      }
    }

    setVideoData({
      url,
      title: url.split("/").pop()?.split("?")[0] || "Imported video",
      thumbnail: generatedThumbnail,
      mime_type: mimeType,
      imetaVideo: {
        url,
        image: generatedThumbnail,
        m: mimeType
      } as never,
      imetaVariants: [{
        url,
        image: generatedThumbnail,
        m: mimeType
      } as never]
    });
    setUrl(url);
    setShowEventInput(false);
  };

  return {
    importFromEvent,
    importFromUrl,
    isImporting
  };
}

function inferMimeTypeFromUrl(url: string): string | undefined {
  const normalized = url.toLowerCase();
  if (normalized.endsWith(".m3u8")) return "application/vnd.apple.mpegurl";
  if (normalized.endsWith(".mpd")) return "application/dash+xml";
  if (normalized.endsWith(".webm")) return "video/webm";
  if (normalized.endsWith(".mov")) return "video/quicktime";
  if (normalized.endsWith(".mp4")) return "video/mp4";
  return undefined;
}
