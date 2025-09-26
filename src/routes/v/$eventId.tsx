import {createFileRoute, useRouter} from '@tanstack/react-router'

import Spinner from "@/components/Spinner.tsx";
import {geVideoByEventIdData, type GeVideoByEventIdDataParams} from "@/helper/nostr.ts";
import {VideoPage} from "@/routes/v/@components/Video.tsx";

/*
 * @route /v/$eventId
 */
export const Route = createFileRoute('/v/$eventId')({
    component: VideoPage,
    loader: ({params: {eventId}, context: {ndk}}) => geVideoByEventIdData({eventId, ndk} as GeVideoByEventIdDataParams),
    pendingComponent: Spinner,
    notFoundComponent: () => <div>Video not found</div>,
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