import {NDKEvent, useCurrentUserProfile, useNDK} from "@nostr-dev-kit/ndk-hooks";
import {VideoPlayer} from "@/components/videoPlayer";
import {ErrorBoundaryVideo} from "./error.tsx";
import {useState} from "react";
import VideoActions from "./VideoActions.tsx";
import CommentSection from "@/routes/v/@components/Comments/comments.tsx";
import {RecordView} from "@/hooks/useRecordView.tsx";
import useVideoStore from "@/store/videoStore.ts";
import {VideoProvider} from "@/context/VideoContext.tsx";
import {useLoaderData} from "@tanstack/react-router";
import {Spinner} from "@radix-ui/themes";


export function VideoPage() {
    const event = useLoaderData({from: "/v/$eventId"}) as NDKEvent
    return <VideoProvider event={event}>
        <ErrorBoundaryVideo>
            <EventLoaded/>;
        </ErrorBoundaryVideo>
    </VideoProvider>

}

function EventLoaded() {
    const [toViewer, setViewed] = useState<boolean>(true)
    const currentUser = useCurrentUserProfile()
    const {ndk} = useNDK()
    const session = useVideoStore(s => s.session!)

    if (!session){
        return <Spinner/>
    }

    async function onCanPlay() {
        console.log("onCanPlay");
        if (toViewer && currentUser) {
            RecordView({
                currentUser,
                eventIdentifier: session?.identification,
                ndk
            }).then(
                async (evt) => {
                    console.log("Event", evt)
                    await evt.publish()
                    setViewed(false)
                }
            )
        }
    }

    return <div className="mx-auto max-w-7xl pb-4 sm:py-4">
        <div className="flex flex-col gap-6 lg:flex-row">
            <div className="shrink-1 flex-1 md:min-w-[500px]">
                {/* Video Player */}
                <div
                    className="sticky top-[calc(var(--header-height))] z-30 aspect-video w-full overflow-hidden sm:static sm:max-h-[calc(61vw-32px)] sm:rounded-xl sm:px-4">
                    <ErrorBoundaryVideo>
                        <VideoPlayer src={session.url} image={session.image!} title={session.title}
                                     onCanPlay={onCanPlay}
                                     className="overflow-hidden sm:rounded-xl"
                        />
                    </ErrorBoundaryVideo>
                </div>
                <div className="px-4">
                    <div className="pt-1">
                        <ErrorBoundaryVideo>
                            <VideoActions event={session.event}/>
                        </ErrorBoundaryVideo>
                    </div>
                    <ErrorBoundaryVideo>
                        <CommentSection
                            eventReference={session.identification!}
                            eventId={session.event.id}
                            pubkey={session.event.pubkey}
                        />
                    </ErrorBoundaryVideo>
                </div>
            </div>
        </div>
    </div>
        ;
}