import {createFileRoute, useLoaderData} from '@tanstack/react-router'
import {NDKKind} from "@nostr-dev-kit/ndk";
import {NDKEvent, type NDKUserProfile} from "@nostr-dev-kit/ndk-hooks";
import Spinner from "@/components/Spinner.tsx";
import {getVideosFromUserData, type GetVideosFromUserDataParams} from "@/helper/nostr.ts";


export const Route = createFileRoute('/u/$userId')({
    component: RouteComponent,
    loader: ({params: {userId}, context: {ndk}}) => getVideosFromUserData({userId, ndk} as GetVideosFromUserDataParams),
    pendingComponent: Spinner,
    notFoundComponent: () => <div>Profile not found</div>,
})

function RouteComponent() {
    const events = useLoaderData({from: "/u/$userId"}) as Set<NDKEvent>
    const user = JSON.parse([...events].filter(e => e.kind === NDKKind.Metadata)[0].content) as NDKUserProfile
    const videos = [...events].filter(e => [NDKKind.Video, NDKKind.HorizontalVideo].includes(e.kind as number))
    return <div>Hello "/u/$userId"!

        <div>{user?.pubkey}</div>
        <div>{user.name}</div>
        <div>Videos count: {videos.length}</div>

    </div>
}
