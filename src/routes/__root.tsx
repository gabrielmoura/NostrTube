import {createRootRouteWithContext, HeadContent, Outlet} from '@tanstack/react-router'
import NDK__default from "@nostr-dev-kit/ndk";
import Header from "../components/header/Header.tsx";
import {Devtools} from "@/Devtools.tsx";

interface NdkContext {
    ndk: NDK__default
}

export const Route = createRootRouteWithContext<NdkContext>()({
    component: RootComponent,
    head: () => ({
        meta: [
            {
                name: 'description',
                content: import.meta.env.VITE_APP_DESCRIPTION,
            },
            {
                title: import.meta.env.VITE_APP_NAME || 'NostrTube',
            },
        ],
        links: [
            {
                rel: 'icon',
                href: '/favicon.ico',
            },
        ],
    }),
})

function RootComponent() {

    return <> <HeadContent/>

    <main className="min-h-[100svh]  bg-background sm:absolute sm:inset-0">
        <div className="f1">
            {/* Header */}
            <Header/>
        </div>

        <Outlet/>
        {import.meta.env.DEV && <Devtools/>}
    </main>
    </>

}