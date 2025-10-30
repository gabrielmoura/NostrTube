import {createLazyFileRoute, useNavigate} from '@tanstack/react-router'
import {lazy, useEffect, useState} from "react";

import {nip19} from "nostr-tools";
import {NDKKind} from "@nostr-dev-kit/ndk";
import Player, {VideoMetadata, VideoUpload} from "@/routes/new/@components/VideoUpload.tsx";
import {cn} from "@/helper/format.ts";

import {Label} from "@/components/label.tsx";
import {NDKEvent, useCurrentUserProfile, useNDK} from "@nostr-dev-kit/ndk-hooks";
import {useMutation} from "@tanstack/react-query";
import {makeEvent, type makeEventParams} from "@/helper/pow/pow.ts";
import {nostrNow} from "@/helper/date.ts";
import {Button} from "@/components/ui/button"
import {t} from "i18next";
import {useGenTagsVideo} from "@/hooks/gentTags.ts";
import {Image} from "@/components/Image.tsx";
import LanguagesCombo from "@/components/ComboBox/ComboLanguage.tsx";
import {AddTagInput} from "@/routes/new/@components/BoxAddToModal.tsx";
import {toast} from "sonner";


const ButtonUpload = lazy(() => import("@/components/ButtonUpload.tsx"))
const Textarea = lazy(() => import("@/components/textarea.tsx"))


export const Route = createLazyFileRoute('/new/')({
    component: Page,
})


function Page() {
    const navigate = useNavigate()
    const {ndk} = useNDK();
    const currentUser = useCurrentUserProfile();

    const [videoData, setVideoData] = useState<Partial<VideoMetadata>>({});
    const [indexers, setIndexers] = useState<string[]>([])
    const [hashtags, setHashtags] = useState<string[]>([])
    const [thumb, setThumb] = useState<string>()
    const [language, setLanguage] = useState<string>()

    useEffect(() => {
        if (!currentUser) {
            navigate({to: "/"}).then(() => toast(t("you_must_be_logged_in_to_upload_videos", "You must be logged in to upload videos"), {
                type: "warning",
                autoClose: 5000
            }))
        }
    }, [currentUser, navigate])

    const makeEventMut = useMutation({
        mutationKey: ['event:generate:new:video'],
        mutationFn: ({ndk, event, difficulty}: makeEventParams): Promise<NDKEvent> => makeEvent({
            ndk,
            event,
            difficulty
        }),
        onSuccess: (event: NDKEvent) =>
            event.publish().then(() => {
                const nip19Encode = nip19.naddrEncode({
                    identifier: event.dTag,
                    relays: import.meta.env.PROD ? import.meta.env.VITE_NOSTR_RELAYS?.split(",") : import.meta.env.VITE_NOSTR_DEV_RELAYS?.split(","),
                    pubkey: event.pubkey,
                    kind: event.kind
                })
                // const encodedEvent = event.encode();
                navigate({to: "/v/$eventId", params: {eventId: nip19Encode}})
                // router.push(`/v/${encodedEvent}`);
                toast(t("video_published_successfully", "Video published successfully"), {
                    type: "success",
                    autoClose: 5000
                });
            }).catch((err) => {
                console.error("error publishing event", err);
                toast(t("error_publishing_video", "Error publishing video"), {
                    type: "error",
                    autoClose: 5000
                });
            })
        ,
        onError: () => toast("Um erro encontrado")
    })
    const {genTags} = useGenTagsVideo()


    function handleSubmit() {

        if (!ndk || !currentUser) return;
        if (!videoData?.url || !videoData?.title) return;

        try {
            const tags = genTags({
                currentPubkey: currentUser.pubkey as string,
                hashtags,
                indexers,
                videoData,
                language,
            })
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

        } catch (err) {
            console.error("error submitting event", err);
        } finally {
            // setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-8 lg:flex-row py-2.5 px-5">
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
                        placeholder={t('add_a_video_title') + "..."}
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
                        placeholder={t('write_a_short_summary_or_description') + "..."}
                        className={cn(
                            "invisible-textarea min-h-[70px] text-base text-foreground placeholder:text-muted-foreground/70"
                        )}
                    />

                    {/* Ações */}
                    <div className="flex items-center gap-3 pt-2">

                        <Button variant="outline" size="sm" disabled>
                            {t('save_as_draft')}
                        </Button>

                        <Button
                            size="sm"
                            onClick={handleSubmit}
                            loading={makeEventMut.isPending}
                            disabled={!videoData?.url || !videoData?.title}
                        >
                            {t('Publish')}
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
                    {videoData?.thumbnail ? (
                        <Image
                            src={videoData.thumbnail}
                            alt="Video thumbnail"
                            className="mb-2 w-full rounded-md border object-cover"
                            width={"288"}
                        />) : (
                        <ButtonUpload
                            setUrl={setThumb}
                            url={thumb}
                            accept={{'image/*': []}}>
                            <Button variant="outline">Upload</Button>
                        </ButtonUpload>
                    )}

                </div>

                {/* Legendas */}
                {/*<div className="rounded-xl border bg-card p-4 shadow-sm">*/}
                {/*    <Label className="text-sm font-medium">Text tracks</Label>*/}
                {/*    <TextTracks/>*/}
                {/*</div>*/}

                {/* Hashtags */}
                <AddTagInput onTagsChange={setHashtags} label="Hashtags" to={hashtags}
                             placeholder="Ex: Bitcoin, Nostr, Entertainment"/>

                {/*Indexers*/}
                <AddTagInput onTagsChange={setIndexers} label="Indexers" to={indexers}
                             placeholder="Ex: imdb:tt12345678, myanimelist:12345"/>


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

                {/* Language */}
                <LanguagesCombo
                    label={t('Language')}
                    placeholder={t('Select_language')}
                    onChange={(lang) => setLanguage(old => lang!.id || old)}
                />


                {/* Disclaimer */}
                {/*<div*/}
                {/*    className="rounded-xl border bg-muted/70 p-4 text-muted-foreground transition-colors hover:border-yellow-500 hover:text-yellow-600 space-y-2">*/}
                {/*    <div className="flex items-center gap-2">*/}
                {/*        <RiAlertLine className="h-5 w-5"/>*/}
                {/*        <Label className="text-sm font-semibold">{t('Disclaimer')}</Label>*/}
                {/*    </div>*/}
                {/*    <p className="text-xs leading-relaxed">*/}
                {/*        {t('disclaimer_text')}*/}
                {/*    </p>*/}
                {/*</div>*/}
            </div>
        </div>

    );
}