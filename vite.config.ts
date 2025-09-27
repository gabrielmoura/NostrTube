import {defineConfig, loadEnv} from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import {VitePWA} from 'vite-plugin-pwa'
import legacy from '@vitejs/plugin-legacy'
import VitePaths from "vite-tsconfig-paths"
import {tanstackRouter} from '@tanstack/router-plugin/vite'


export default defineConfig(({mode}) => {
    // Load environment variables based on the current mode
    const env = loadEnv(mode, process.cwd(), ''); // The third argument is the prefix for client-side variables (e.g., 'VITE_')
    const chunkVideo = ['node_modules/@vidstack/react', 'hls.js', 'dashjs'];
    const chunkIcons = ['react-icons', '@heroicons/react', 'media-icons', 'lucide-react'];
    // const chunkI18next = ['i18next', 'i18next-browser-languagedetector', 'i18next-http-backend']
    // const chunckCore = ['src', '@nostr-dev-kit', '@radix-ui', '@tanstack', 'react', 'zustand']

    function checkDependency(id: string, options: string[]): boolean {
        let value: boolean = false
        options.forEach((item) => {
            if (id.includes(item)) {
                value = id.includes(item)
            }
        }, options)
        return value
    }

    return {
        plugins: [
            tailwindcss(),
            react(),
            VitePWA({
                    registerType: 'autoUpdate',
                    includeManifestIcons: true,
                    workbox: {
                        clientsClaim: true,
                        skipWaiting: true,
                        maximumFileSizeToCacheInBytes: 1024 * 1024 * 4
                    },
                    devOptions: {
                        enabled: true
                    },
                    manifest: {
                        name: env.VITE_APP_DESCRIPTION,
                        start_url: ".",
                        short_name: env.VITE_APP_NAME,
                        icons: [
                            {
                                src: "/logo.svg",
                            }
                        ],
                        categories: ["social"],
                        protocol_handlers: [
                            {
                                protocol: "web+nostr",
                                url: "/l/%s",
                            },
                            {
                                protocol: "nostr",
                                url: "/l/%s",
                            },
                        ],
                    },
                },
            ),
            legacy({
                polyfills: ['es.promise.finally', 'es/map', 'es/set'],
                modernPolyfills: ['es.promise.finally'],
                targets: ['defaults', 'not IE 11'],
            }),
            VitePaths(),
            tanstackRouter({
                target: 'react',
                autoCodeSplitting: true,
                routeFileIgnorePrefix: "@"
            }),
        ],
        build: {
            sourcemap: false,
            cssMinify: true,
            minify: true,
            cssCodeSplit: true,
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (checkDependency(id, chunkVideo)) {
                            return 'video'
                        }
                        if (checkDependency(id, chunkIcons)) {
                            return 'icons'
                        }
                        if (id.includes('node_modules') && !checkDependency(id, [...chunkVideo, ...chunkIcons])) {
                            return 'vendor'
                        }
                    }
                },
                cache: true
            },
        },
    };
});
