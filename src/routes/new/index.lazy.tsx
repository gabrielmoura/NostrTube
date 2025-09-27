import {createLazyFileRoute, useRouter} from '@tanstack/react-router'
import {useState} from "react";

import {nip19} from "nostr-tools";

import Thumbnail from "@/routes/new/@components/thumbnail.tsx";
import TextTracks from "@/routes/new/@components/textTracks.tsx";
import {RiAlertLine} from "react-icons/ri";
import {NDKKind} from "@nostr-dev-kit/ndk";
import Player, {VideoUpload} from "@/routes/new/@components/VideoUpload.tsx";
import {cn} from "@/helper/format.ts";
import {Textarea} from "@/components/textarea.tsx";

import {Label} from "@/components/label.tsx";
import {NDKEvent, useCurrentUserProfile, useNDK} from "@nostr-dev-kit/ndk-hooks";
import {useMutation} from "@tanstack/react-query";
import {makeEvent, type makeEventParams} from "@/helper/pow/pow.ts";
import {nostrNow} from "@/helper/date.ts";
import {nanoid} from "nanoid";
import {Button} from "@/components/button.tsx";


export const Route = createLazyFileRoute('/new/')({
    component: Page,
})


function Page() {
    const {navigate} = useRouter();
    const {ndk} = useNDK();
    const currentUser = useCurrentUserProfile();
    const [videoData, setVideoData] = useState<{
        url?: string;
        title?: string;
        summary?: string;
        thumbnail?: string;
        fileType?: string;
        fileHash?: string;
        fileSize?: number;
        duration?: number;
        hashtags?: string;
        contentWarning?: string;
    }>({});
    const makeEventMut = useMutation({
        mutationKey: ['event:generate:new:video'],
        mutationFn: ({ndk, event, difficulty}: makeEventParams): Promise<NDKEvent> => makeEvent({
            ndk,
            event,
            difficulty
        }),
        onSuccess: async (event: NDKEvent) => {
            await event.publish()
            const nip19Encode = nip19.naddrEncode({
                identifier: event.dTag,
                relays: import.meta.env.PROD ? import.meta.env.VITE_NOSTR_RELAYS?.split(",") : import.meta.env.VITE_NOSTR_DEV_RELAYS?.split(","),
                pubkey: event.pubkey,
                kind: event.kind
            })
            // const encodedEvent = event.encode();
            await navigate({to: "/v/$eventId", params: {eventId: nip19Encode}})
            // router.push(`/v/${encodedEvent}`);
        }
    })


    function handleSubmit() {
        if (!ndk || !currentUser) return;
        if (!videoData?.url || !videoData?.title) return;
        const relays: string = import.meta.env.PROD ? import.meta.env.VITE_NOSTR_RELAYS : import.meta.env.VITE_NOSTR_DEV_RELAYS

        console.log("handleSubmit")
        try {
            const d = nanoid(7);

            const imeta = ["imeta", "url" + " " + videoData.url];

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
                        pubkey: currentUser.pubkey as string,
                        relays: relays.split(",")
                    })}`,
                ],
            ];

            if (videoData.fileType) {
                imeta.push("m" + " " + videoData.fileType)

            }
            if (videoData.fileHash) {
                imeta.push("x" + " " + videoData.fileHash)
            }
            if (videoData.fileSize) {
                imeta.push("size" + " " + videoData.fileSize.toString())

            }
            if (videoData.duration) {
                imeta.push("duration" + " " + videoData.duration.toString())

            }

            if (videoData.thumbnail) {
                imeta.push("thumb" + " " + videoData.thumbnail)
                imeta.push("image" + " " + videoData.thumbnail)
            }

            if (videoData.contentWarning) {
                tags.push(["content-warning", videoData.contentWarning]);
            }
            if (videoData.hashtags) {
                const hashtags = videoData.hashtags.split(",").map((t) => t.trim());
                for (const hashtag of hashtags) {
                    tags.push(["t", hashtag]);
                }
            }
            tags.push(imeta)

            // const event = await createEvent(ndk, preEvent);
            makeEventMut.mutate({
                ndk: ndk,
                event: {
                    tags: tags,
                    pubkey: currentUser.pubkey as string,
                    kind: NDKKind.Video,
                    content: videoData.summary ?? "",
                    created_at: nostrNow()
                },
                difficulty: 16,
            })


            // if (event) {
            //     console.log("Event", event);
            //     // toast.success("Video published!");
            //     const encodedEvent = event.encode();
            //
            //     //     router.navigate("/v/$eventId", {
            //     //     {
            //     //         params:{
            //     //             eventId:encodedEvent
            //     //         }
            //     //     }
            //     // })
            //     navigate({to: `/w/${encodedEvent}`})
            // } else {
            //     // toast.error("An error occured");
            // }
        } catch (err) {
            console.log("error submitting event", err);
        } finally {
            // setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-8 lg:flex-row">
            {/* Coluna principal (Player + Metadados do vídeo) */}
            <div className="flex-1 min-w-[320px] md:min-w-[500px] space-y-6">
                {/* Player ou Upload */}
                <div className="w-full overflow-hidden rounded-2xl border bg-background shadow-sm">
                    {videoData?.url ? (
                        <Player
                            url={videoData.url}
                            title={videoData.title}
                            image={videoData.thumbnail}
                        />
                    ) : (
                        <VideoUpload setVideo={setVideoData}/>
                    )}
                </div>

                {/* Título + Resumo */}
                <div className="space-y-4">
                    <Textarea
                        // ref={titleRef}
                        value={videoData?.title}
                        onChange={(e) =>
                            setVideoData((prev) => ({...prev, title: e.target.value}))
                        }
                        placeholder="Add a video title..."
                        autoFocus
                        className={cn(
                            "invisible-textarea text-3xl font-semibold tracking-tight text-foreground placeholder:text-muted-foreground/70"
                        )}
                    />

                    <Textarea
                        // ref={summaryRef}
                        value={videoData?.summary}
                        onChange={(e) =>
                            setVideoData((prev) => ({...prev, summary: e.target.value}))
                        }
                        placeholder="Write a short summary or description..."
                        className={cn(
                            "invisible-textarea min-h-[70px] text-base text-foreground placeholder:text-muted-foreground/70"
                        )}
                    />

                    {/* Ações */}
                    <div className="flex items-center gap-3 pt-2">

                        <Button variant="outline" size="sm" disabled>
                            Save as Draft
                        </Button>

                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            loading={makeEventMut.isPending}
                            disabled={!videoData?.url || !videoData?.title}
                        >
                            Publish
                        </Button>
                    </div>
                </div>
            </div>

            {/* Coluna lateral (Configurações do vídeo) */}
            <div className="w-full lg:max-w-[380px] space-y-5">
                {/* Thumbnail */}
                <div
                    className={cn(
                        "rounded-xl border bg-card p-4 shadow-sm",
                        videoData?.thumbnail && "space-y-3"
                    )}
                >
                    <Label className="text-sm font-medium">Thumbnail</Label>
                    <Thumbnail
                        url={videoData?.thumbnail}
                        onChange={(newThumbnailUrl) =>
                            setVideoData((prev) => ({...prev, thumbnail: newThumbnailUrl}))
                        }
                    />
                </div>

                {/* Legendas */}
                <div className="rounded-xl border bg-card p-4 shadow-sm">
                    <Label className="text-sm font-medium">Text tracks</Label>
                    <TextTracks/>
                </div>

                {/* Hashtags */}
                <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
                    <Label className="text-sm font-medium">Hashtags</Label>
                    <Textarea
                        value={videoData?.hashtags}
                        onChange={(e) =>
                            setVideoData((prev) => ({...prev, hashtags: e.target.value}))
                        }
                        placeholder="e.g. Bitcoin, Nostr, Entertainment"
                        className="text-sm"
                    />
                </div>

                {/* Aviso de conteúdo */}
                <div className="rounded-xl border bg-card p-4 shadow-sm space-y-2">
                    <Label className="text-sm font-medium">Content warning</Label>
                    <Textarea
                        value={videoData?.contentWarning}
                        onChange={(e) =>
                            setVideoData((prev) => ({
                                ...prev,
                                contentWarning: e.target.value,
                            }))
                        }
                        placeholder="Optional warning (e.g. sensitive content)"
                        className="text-sm"
                    />
                </div>

                {/* Disclaimer */}
                <div
                    className="rounded-xl border bg-muted/70 p-4 text-muted-foreground transition-colors hover:border-yellow-500 hover:text-yellow-600 space-y-2">
                    <div className="flex items-center gap-2">
                        <RiAlertLine className="h-5 w-5"/>
                        <Label className="text-sm font-semibold">Disclaimer</Label>
                    </div>
                    <p className="text-xs leading-relaxed">
                        By using this service, you confirm that this video belongs to you or
                        that you have the right to publish it.
                    </p>
                </div>
            </div>
        </div>

    );
}

