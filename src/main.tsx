import {type ReactNode, StrictMode, useEffect} from 'react'
import {createRoot} from 'react-dom/client'
import {createRouter, RouterProvider} from '@tanstack/react-router'
import {Theme} from "@radix-ui/themes";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import {routeTree} from './routeTree.gen'

import NDKCacheAdapterDexie from "@nostr-dev-kit/ndk-cache-dexie";
import NDK, {NDKPool} from "@nostr-dev-kit/ndk";
import {NDKSessionLocalStorage, useNDK, useNDKInit, useNDKSessionMonitor} from "@nostr-dev-kit/ndk-hooks";
import './helper/i18n';
import "./main.css"
import {ToastContainer} from "react-toastify";

// register nostr: protocol handler
if (import.meta.env.PROD) {
    try {
        navigator.registerProtocolHandler("web+nostr", new URL("/l/%s", location.origin).toString());
    } catch (e) {
        console.log("Failed to register handler");
        console.log(e);
    }
}


const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
        }
    },
})
export type RouteAlertType = | "success" | "error" | "warning";

interface RouteAlert {
    message: string | string[];
    type: RouteAlertType
}

// Register things for typesafety
declare module '@tanstack/react-router' {
    interface Register {
        router: typeof router
    }
}
declare module '@tanstack/react-router' {
    interface HistoryState {
        alert?: RouteAlert
    }
}


const sigWorker = new Worker(new URL('@nostr-dev-kit/ndk/workers/sig-verification?worker', import.meta.url), {type: 'module'})

let cacheAdapter: NDKCacheAdapterDexie | undefined;
if (typeof window !== "undefined") {
    cacheAdapter = new NDKCacheAdapterDexie({dbName: import.meta.env.VITE_APP_NAME});
}
const relays = import.meta.env.PROD ? import.meta.env.VITE_NOSTR_RELAYS : import.meta.env.VITE_NOSTR_DEV_RELAYS
const ndkInstance = new NDK({
    // explicitRelayUrls: relays.split(","),
    clientName: import.meta.env.VITE_APP_NAME,
    cacheAdapter: cacheAdapter,
    signatureVerificationWorker: sigWorker,
    autoConnectUserRelays: import.meta.env.PROD,
    clientNip89: import.meta.env.VITE_APP_NAME,
});
const pool = new NDKPool(relays.split(","), [], ndkInstance)
ndkInstance.pool = pool
// Set up a Router instance
const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    scrollRestoration: true,
    context: {
        queryClient,
        ndk: ndkInstance
    },
});
// Connect to relays
if (typeof window !== "undefined") ndkInstance.connect();

const sessionStorage = new NDKSessionLocalStorage();


// eslint-disable-next-line react-refresh/only-export-components
function PreRoot({children}: { children: ReactNode }) {
    const initializeNDK = useNDKInit();
    const {ndk} = useNDK();

    // Initialize NDK on component mount
    useEffect(() => {
        if (!ndk) {
            initializeNDK(ndkInstance);
        }
    }, [ndk, initializeNDK]);

    // Set up session storage and monitor
    useNDKSessionMonitor(sessionStorage, {follows: true, profile: true});
    return children
}


const root = document.getElementById('root') as HTMLElement
createRoot(root).render(
    <StrictMode>
        <PreRoot>
            <QueryClientProvider client={queryClient}>
                <Theme>
                    <RouterProvider router={router}/>
                    <ToastContainer/>
                </Theme>
            </QueryClientProvider>
        </PreRoot>
    </StrictMode>
);