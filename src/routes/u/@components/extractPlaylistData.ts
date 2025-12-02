import { NDKEvent } from "@nostr-dev-kit/ndk";

export interface PlaylistData {
  title: string;
  description?: string;
  image?: string;
  videoCount: number;
}

export function extractPlaylistData(event: NDKEvent): PlaylistData {
  const getTag = (key: string) => event.tags.find((t) => t[0] === key)?.[1];

  // Conta quantas referências a eventos ('a' ou 'e') existem na lista
  const videoCount = event.tags.filter(t => t[0] === "a" || t[0] === "e").length;

  return {
    // Tenta pegar a tag 'title', se não houver, usa o identificador 'd', ou um fallback
    title: getTag("title") || getTag("name") || getTag("d") || "Playlist sem título",
    description: getTag("description") || getTag("summary"),
    image: getTag("image") || getTag("thumb"), // Suporte para thumb ou image
    videoCount
  };
}