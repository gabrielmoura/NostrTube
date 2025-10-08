import {useState} from "react";
import {useNDK} from "@nostr-dev-kit/ndk-hooks";
import {nip19} from "nostr-tools";
import {getTagValue, getTagValues} from "@welshman/util";
import {Label} from "@/components/label.tsx";
import {Input} from "@/components/input.tsx";
import {Button} from "@/components/button.tsx";
import {RiSearchLine} from "react-icons/ri";

export default function LoadVideoFromOthers({
                                                setShowEventInput,
                                                videoUrl,
                                                setVideoUrl,
                                                setVideo
                                            }) {

    const [eventTagId, setEventTagId] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const {ndk} = useNDK();

    async function handleSearch() {
        if (!eventTagId) return;
        const {data, type} = nip19.decode(eventTagId);
        if (["naddr", "nevent"].indexOf(type) === -1) {
            return alert("Invalid naddr or nevent");
        }
        setIsSearching(true);
        try {
            const filters = {
                limit: 1,
            }
            if (data.kind) {
                filters.kinds = [data.kind]
            }
            if (data.pubkey) {
                filters.authors = [data.pubkey]
            }
            if (data.identifier) {
                filters["#d"] = [data.identifier]
            }
            if (data.id) {
                filters.ids = [data.id]
            }
            const eventsSet = await ndk!.fetchEvents(filters);
            const events = Array.from(eventsSet)
            console.log("Events found", events);
            if (events.length && events[0]) {
                const url = getTagValues("url", events[0].tags);
                if (!url) return alert("Invalid event");
                const title = getTagValues("url", events[0].tags);
                const summary =
                    getTagValues("summary", events[0].tags) ?? events[0].content;
                const thumbnail =
                    getTagValues("thumb", events[0].tags);
                const image = getTagValues("image", events[0].tags);
                const fileType = getTagValues("m", events[0].tags);
                const fileHash = getTagValues("x", events[0].tags);
                const fileSize = getTagValue("size", events[0].tags);
                const duration = getTagValue("duration", events[0].tags);
                const fallback: string[] = getTagValues("fallback", events[0].tags)
                setVideo({
                    url,
                    title,
                    summary,
                    thumbnail: thumbnail ?? image,
                    imetaVideo: {
                        url: url,
                        size: fileSize ? parseInt(fileSize) : undefined,
                        m: fileType,
                        dim: getTagValue("dim", events[0].tags),
                        blurhash: getTagValue("blurhash", events[0].tags),
                        x: fileHash,
                        fallback: fallback,
                        duration: duration ? parseInt(duration) : undefined,
                        thumb: thumbnail ?? image,
                        image: image ?? thumbnail
                    },
                });
            }
        } catch (err) {
            console.log("Error searching", err);
        } finally {
            setIsSearching(false);
        }
    }

    return (
        <div
            className="center relative w-full flex-col gap-y-2 overflow-hidden rounded-md bg-muted aspect-video md:aspect-square  h-80 max-h-full">
            <div className="mx-auto w-full max-w-[300px] rounded-lg bg-background/40 px-3 py-3">
                <Label>Kind 1063 event</Label>
                <div className="flex gap-2">
                    <Input
                        value={eventTagId}
                        onChange={(e) => setEventTagId(e.target.value)}
                        placeholder={"naddr1..."}
                    />
                    <Button
                        onClick={handleSearch}
                        loading={isSearching}
                        disabled={isSearching}
                        size="icon"
                        className="shrink-0"
                    >
                        <RiSearchLine className="h-5 w-5"/>
                    </Button>
                </div>
            </div>
            <div className="center">or</div>
            <div className="mx-auto w-full max-w-[300px] rounded-lg bg-background/40 px-3 py-3">
                <Label>Video Url</Label>
                <div className="flex gap-2">
                    <Input
                        value={videoUrl}
                        onChange={(e) => {
                            if (e.target.value.includes("youtu")) {
                                alert(
                                    "Please enter the url to where the video is hosted. A youtube link will not work on all clients.",
                                );
                                return setVideoUrl("");
                            }
                            return setVideoUrl(e.target.value);
                        }}
                        placeholder={"https://... (not a YouTube link)"}
                    />
                    <Button
                        onClick={() =>
                            setVideo((prev) => ({
                                ...prev,
                                url: videoUrl,
                                thumbnail: videoUrl.includes("youtu")
                                    ? `http://i3.ytimg.com/vi/${
                                        videoUrl.includes("/youtu.be/")
                                            ? videoUrl.split("youtu.be/").pop()
                                            : videoUrl.split("?v=").pop()
                                    }/hqdefault.jpg`
                                    : prev.thumbnail,
                            }))
                        }
                        loading={isSearching}
                        disabled={isSearching}
                        size="icon"
                        className="shrink-0"
                    >
                        <RiSearchLine className="h-5 w-5"/>
                    </Button>
                </div>
            </div>
            <Button onClick={() => setShowEventInput(false)} variant="ghost" className="border border-dashed">
                Back
            </Button>
        </div>
    );
}

