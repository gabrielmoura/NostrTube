import {useRouter, createLazyFileRoute} from '@tanstack/react-router'

import Spinner from "@/components/Spinner.tsx";
import {geVideoByEventIdData, type GeVideoByEventIdDataParams} from "@/helper/nostr.ts";
import {VideoPage} from "@/routes/v/@components/Video.tsx";
import {NotFoundVideo} from "@/routes/v/@components/NotFoundVideo.tsx";

/*
 * @route /v/$eventId
 */
export const Route = createLazyFileRoute('/v/$eventId')({
    component: VideoPage,
    loader: ({params: {eventId}, context: {ndk}}) => geVideoByEventIdData({eventId, ndk} as GeVideoByEventIdDataParams),
    pendingComponent: Spinner,
    notFoundComponent: () => <NotFoundVideo/>,
    errorComponent: ({error}) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const router = useRouter()

        return (
            <div>
                {error.message}
                <button
                    onClick={() => {
                        // Invalidate the route to reload the loader, which will also reset the error boundary
                        router.invalidate()
                    }}
                >
                    retry
                </button>
            </div>
        )
    },

})