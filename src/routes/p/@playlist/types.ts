import type NDK__default from "@nostr-dev-kit/ndk";
import type { NDKEvent } from "@nostr-dev-kit/ndk";

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
  dTag?: string; // tag de evento na playlist
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverImage?: string;
  items: VideoItem[];
  ownerPubkey: string;

}
export interface PlaylistFetch{
  metaEvent?: NDKEvent;
  playlist:Playlist;
}

// Interfaces para as APIs Abstratas
export interface IPlaylistAPI {
  fetchPlaylist(ndk: NDK__default, id?: string): Promise<PlaylistFetch>;

  savePlaylist(playListEvent: NDKEvent, playlist: Playlist): Promise<NDKEvent>;

  deleteItemFromPlaylist(playListEvent: NDKEvent, itemId: string): Promise<NDKEvent>;
}