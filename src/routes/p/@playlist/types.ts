export interface NostrUser {
  pubkey: string;
  name?: string;
  image?: string;
}

export interface VideoItem {
  id: string; // NIP-19 naddr ou event id
  title: string;
  description: string;
  thumbnailUrl: string;
  duration: number; // em segundos
  author: NostrUser;
  publishedAt: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  items: VideoItem[];
  ownerPubkey: string;
}

// Interfaces para as APIs Abstratas
export interface IPlaylistAPI {
  fetchPlaylist(id: string): Promise<Playlist>;
  savePlaylist(playlist: Playlist): Promise<void>;
  deleteItemFromPlaylist(playlistId: string, itemId: string): Promise<void>;
}