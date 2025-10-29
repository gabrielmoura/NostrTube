import {ulid} from "ulid";
import {nostrNow} from "@/helper/date.ts";

export interface playListItem {
    id: string,
    kind: number
    title?: string
}

export interface playListProps {
    name: string,
    description?: string,
    videos?: playListItem[]
}

interface useGenPlayListVideo {
    genPlayListTag: (playlist: playListProps) => string[][];
    addVideoToPlayListTag: (playlistTag: string[][], video: playListItem) => string[][];
    removeVideoFromPlayListTag: (playlistTag: string[][], videoId: string) => string[][];
}

export function useGenPlayListVideo(): useGenPlayListVideo {
    function genPlayListTag(playlist: playListProps): string[][] {
        const d = ulid();
        const tags: string[][] = [
            ["d", `${import.meta.env.VITE_APP_NAME}-${d}`],

        ];
        tags.push(["title", playlist.name]);
        if (playlist.description) {
            tags.push(["description", playlist.description]);
        }
        if (playlist.videos && playlist.videos.length > 0) {
            playlist.videos.forEach(v => {
                tags.push(["a", `${v.kind}:${v.id}`, v.title || "", nostrNow().toString()]);
            });
        }
        return tags;
    }

    function addVideoToPlayListTag(playlistTag: string[][], video: playListItem): string[][] {
        playlistTag.push(["a", `${video.kind}:${video.id}`, video.title || "", nostrNow().toString()]);
        return playlistTag;
    }

    function removeVideoFromPlayListTag(playlistTag: string[][], videoId: string): string[][] {
        return playlistTag.filter(tag => !(tag[0] === "a" && tag[1] === videoId));
    }

    return {genPlayListTag, addVideoToPlayListTag, removeVideoFromPlayListTag};
}