import {createFileRoute, Link, useSearch} from '@tanstack/react-router'
import {zodValidator} from '@tanstack/zod-adapter'
import {NDKSubscriptionCacheUsage, useSubscribe} from "@nostr-dev-kit/ndk-hooks";
import VideoCard, {VideoCardLoading} from "@/components/cards/videoCard";
import {sortEventsByImages} from "@/helper/format.ts";
import {eventSearchSchema} from "@/helper/nostr.ts";
import type {NDKFilter} from "@nostr-dev-kit/ndk";
import {NDKKind} from "@nostr-dev-kit/ndk";
import Spinner from "@/components/Spinner.tsx";
import {uniqBy} from "ramda";
import {getTagValues} from "@welshman/util";
import {Section, SectionContent, SectionHeader, SectionTitle} from "@/containers/pageSection";


export const Route = createFileRoute('/search/')({
    component: RouteComponent,
    validateSearch: zodValidator(eventSearchSchema),
    loaderDeps: ({search: {search, nsfw, tag}}) => ({search, nsfw, tag}),
    // loader: ({deps, context: {ndk}}) => getVideosFromSearchData({...deps, ndk}),
    pendingComponent: Spinner,
    // notFoundComponent: () => <div>nehum resultado encontrado</div>,

})

function RouteComponent() {

    return <div className="relative space-y-6 pt-5 sm:pt-7">
        <Search/>
    </div>
}

function Search() {
    const {search, nsfw, tag} = useSearch({
        from: "/search/"
    })
    const tags = tag
        ? Array.isArray(tag) ? tag.map((t) => ({"#t": [t]})) : {"#t": [tag]}
        : undefined

    const filters: NDKFilter[] = [
        {
            kinds: [NDKKind.Video, NDKKind.HorizontalVideo],
            limit: 50,
            ...(search ? {search} : {}),
            ...(tags ? tags : {}),
            ...(nsfw ? {"#content-warning": ""} : {}),
        },
    ]
    const relaysSearch = (import.meta.env.VITE_NOSTR_SEARCH_RELAYS.length > 5) ? import.meta.env.VITE_NOSTR_SEARCH_RELAYS.split(",") : undefined
    const {events} = useSubscribe(filters, {
        closeOnEose: true,
        cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
        relayUrls: relaysSearch,
    })


    const processedEvents = uniqBy(
        (e) => getTagValues("title", e.tags),
        events,
    )
        // .slice(50)
        .sort(sortEventsByImages);


    if (processedEvents.length) {
        return (
            <section className="relative px-5 space-y-6 sm:space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="font-main font-bold text-2xl sm:text-3xl tracking-tight">
                        Recent Uploads
                    </h2>
                    {/* <Link to="/uploads" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link> */}
                </div>

                {/* Grid de vídeos */}
                <div className="relative">
                    <ul className="grid gap-6 sm:gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {processedEvents.map((e) => (
                            <li key={e.id} className="flex">
                                <Link
                                    to="/v/$eventId"
                                    params={{eventId: e.encode()}}
                                    className="block w-full focus:outline-none focus:ring-2 focus:ring-primary rounded-lg"
                                >
                                    <VideoCard event={e}/>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </section>
        );
    }
    return (
        <Section className="px-5">
            <SectionHeader>
                <SectionTitle className="font-main text-2xl font-semibold sm:text-3xl">
                    Recent Uploads
                </SectionTitle>
            </SectionHeader>
            <SectionContent className="md-feed-cols relative mx-auto gap-4">
                <VideoCardLoading/>
                <VideoCardLoading/>
                <VideoCardLoading/>
            </SectionContent>
        </Section>
    );
}

