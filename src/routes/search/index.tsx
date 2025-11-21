import {createFileRoute, Link, useSearch} from '@tanstack/react-router'
import {zodValidator} from '@tanstack/zod-adapter'
import {NDKSubscriptionCacheUsage, useSubscribe} from "@nostr-dev-kit/ndk-hooks";
import {VideoCardLoading} from "@/components/cards/videoCard";
import {sortEventsByImages} from "@/helper/format.ts";
import {eventSearchSchema} from "@/helper/nostr.ts";
import type {NDKFilter} from "@nostr-dev-kit/ndk";
import {NDKKind} from "@nostr-dev-kit/ndk";
import {uniqBy} from "ramda";
import {getTagValues} from "@welshman/util";
import {Section, SectionContent, SectionHeader, SectionTitle} from "@/components/containers/pageSection";
import {PageSpinner} from "@/components/PageSpinner.tsx";
import React, {lazy, useEffect} from "react"
import {t} from "i18next"

const VideoCard = lazy(() => import('@/components/cards/videoCard'));


export const Route = createFileRoute('/search/')({
    component: RouteComponent,
    validateSearch: zodValidator(eventSearchSchema),
    loaderDeps: ({search: {search, nsfw, tag,lang}}) => ({search, nsfw, tag,lang}),
    // loader: ({deps, context: {ndk}}) => getVideosFromSearchData({...deps, ndk}),
    pendingComponent: PageSpinner,
    // notFoundComponent: () => <div>nehum resultado encontrado</div>,
    errorComponent: HasError,

})

function HasError({error}: { error: Error }) {
    useEffect(() => {
        if (import.meta.env.VITE_BEACON_URL) {
            navigator?.sendBeacon(import.meta.env.VITE_BEACON_URL, JSON.stringify(error))
        }
    }, [error]);
    const handleReload = () => {
        window.location.reload();
    };
    return (
        <div
            className="flex flex-col items-center justify-center p-6 m-4 bg-red-50 border-l-4 border-red-500 text-red-800 rounded-lg shadow-md"
            role="alert"
        >
            {/* Ícone de Alerta */}
            <div className="mb-4">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 text-red-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                >
                    <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-4a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z"
                        clipRule="evenodd"
                    />
                </svg>
            </div>

            <h1 className="text-2xl font-bold mb-2">Ops! Algo deu errado.</h1>
            <p className="text-center text-red-700">
                Não foi possível carregar este conteúdo. Por favor, tente novamente ou volte ao início.
            </p>

            {/* Container para os botões de ação */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                {/* Botão para voltar ao início (condicional) */}
                <Link to={"/"}>
                    <button

                        className="px-5 py-2.5 bg-transparent border border-red-600 text-red-700 font-semibold rounded-lg shadow-sm hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                    >
                        Voltar ao Início
                    </button>
                </Link>

                {/* Botão primário para recarregar a página */}
                <button
                    onClick={handleReload}
                    className="px-5 py-2.5 bg-red-600 text-white font-semibold rounded-lg shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                    Recarregar Página
                </button>
            </div>

            {/* Opcional: Detalhes do erro em ambiente de desenvolvimento */}
            {/*{process.env.NODE_ENV === 'development' && this.state.error && (*/}
            <details className="mt-6 w-full max-w-lg text-left">
                <summary className="cursor-pointer text-sm font-medium text-red-600 hover:text-red-800">
                    Detalhes do Erro
                </summary>
                <pre
                    className="mt-2 p-3 bg-red-100 text-red-900 text-xs rounded-md overflow-auto whitespace-pre-wrap break-all">
                                {error?.toString()}
                            </pre>
            </details>
            {/*)}*/}
        </div>
    );
}

function RouteComponent() {

    return <div className="relative space-y-6 pt-5 sm:pt-7">
        <Search/>
    </div>
}

function Search() {
    const {search, nsfw, tag,lang} = useSearch({
        from: "/search/"
    })
    const tags = tag
        ? Array.isArray(tag) ? tag.map((t) => ({"#t": [t]})) : {"#t": [tag]}
        : undefined
    if (lang) {
        if(Array.isArray(tags)){
            tags.push(["l", lang])
        }
    }

    const filters: NDKFilter[] = [
        {
            kinds: [NDKKind.Video, NDKKind.HorizontalVideo],
            limit: 100,
            ...(search ? {search} : {}),
            ...(tags ? tags : {}),
            ...(nsfw ? {"#content-warning": ""} : {}),
        },
    ]
    const relaysSearch = (import.meta.env.VITE_NOSTR_SEARCH_RELAYS.length > 5) ? import.meta.env.VITE_NOSTR_SEARCH_RELAYS.split(",") : undefined
    const {events} = useSubscribe(filters, {
        closeOnEose: true,
        cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
        relayUrls: relaysSearch
    }, [search, nsfw, tag])


    const processedEvents = uniqBy(
        (e) => getTagValues("title", e.tags),
        events,
    ).sort(sortEventsByImages);


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
                    {t('Search','Search')}
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

