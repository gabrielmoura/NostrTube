import {nostrNow} from "@/helper/date.ts";
import {nip19} from "nostr-tools";
import {imetaTagToTag, NDKKind} from "@nostr-dev-kit/ndk";
import {VideoMetadata} from "@/routes/new/@components/VideoUpload.tsx";
import {ulid} from "ulid";

interface genTagsProps {
    videoData: Partial<VideoMetadata>
    currentPubkey: string
    hashtags: string[]
    indexers: string[]
}

interface useGenTagsVideo {
    genTags: (params: genTagsProps) => string[][]
}

export function useGenTagsVideo(): useGenTagsVideo {
    const genTags = ({videoData, currentPubkey, hashtags, indexers}: genTagsProps): string[][] => {
        if (!currentPubkey) return;
        if (!videoData?.url || !videoData?.title) return;
        const relays: string = import.meta.env.PROD ? import.meta.env.VITE_NOSTR_RELAYS : import.meta.env.VITE_NOSTR_DEV_RELAYS

        const d = ulid();

        const tags: string[][] = [
            ["d", d],
            // ["url", videoData.url],
            ["title", videoData.title],
            ["summary", videoData.summary ?? ""],
            ["published_at", nostrNow().toString()],
            [
                "alt",
                `This is a video event and can be viewed at ${
                    import.meta.env.VITE_PUBLIC_ROOT_DOMAIN ?? "https://nostr-tube.com"
                }/v/${nip19.naddrEncode({
                    identifier: d,
                    kind: NDKKind.Video,
                    pubkey: currentPubkey as string,
                    relays: relays.split(",")
                })}`,
            ],
        ];

        // if (videoData.fileType) {
        //     imeta.push("m" + " " + videoData.fileType)
        //
        // }
        // if (videoData.fileHash) {
        //     imeta.push("x" + " " + videoData.fileHash)
        // }
        // if (videoData.fileSize) {
        //     imeta.push("size" + " " + videoData.fileSize.toString())
        //
        // }
        // if (videoData.duration) {
        //     imeta.push("duration" + " " + videoData.duration.toString())
        //
        // }


        if (videoData.thumbnail) {
            tags.push(['thumb', videoData.thumbnail, 'image', videoData.thumbnail])
        }

        if (videoData.url) {
            tags.push(["imeta", `url ${videoData.url}`])
        }

        if (videoData.contentWarning) {
            tags.push(["content-warning", videoData.contentWarning]);
        }
        if (hashtags) {
            hashtags.forEach(hashtag => tags.push(["t", hashtag]))
        }
        if (indexers) {
            indexers.forEach(index => tags.push(["i", index]))
        }
        if (videoData.imetaVideo) {
            const imetaT = imetaTagToTag(videoData.imetaVideo)
            if (videoData.thumbnail) {
                imetaT.push(`thumb ${videoData.thumbnail}`)
                imetaT.push(`image ${videoData.thumbnail}`)
            }
            imetaT.push("service nip96")
            tags.push(imetaT)
        }
        return tags
    }
    return {genTags}
}