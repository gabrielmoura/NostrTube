import { type IPlaylistAPI, type Playlist } from './types';

// Mock implementation
export const playlistApi: IPlaylistAPI = {
  fetchPlaylist: async (id: string) => {
    // Simula delay de rede
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      id,
      name: "Melhores Vídeos de Bitcoin",
      description: "Uma seleção curada sobre o protocolo.",
      coverImage: "https://images.unsplash.com/photo-1516245834210-c4c14278733f?w=800&q=80",
      ownerPubkey: "npub1...",
      items: Array.from({ length: 5 }).map((_, i) => ({
        id: `video-${i}`,
        title: `Entendendo o Nostr - Parte ${i + 1}`,
        description: "Um mergulho profundo no protocolo descentralizado.",
        thumbnailUrl: `https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80`,
        duration: 360 + i * 20,
        author: { pubkey: "npub...", name: "Satoshi Dev" },
        publishedAt: Date.now()
      })),
    };
  },

  savePlaylist: async (playlist: Playlist) => {
    console.log("Salvando no Relay...", playlist);
    await new Promise((resolve) => setTimeout(resolve, 800));
  },

  deleteItemFromPlaylist: async (playlistId, itemId) => {
    console.log(`Removendo ${itemId} da playlist ${playlistId}`);
  }
};