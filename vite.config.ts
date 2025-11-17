import {defineConfig, loadEnv} from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import {VitePWA} from 'vite-plugin-pwa'
import legacy from '@vitejs/plugin-legacy'
import VitePaths from "vite-tsconfig-paths"
import {tanstackRouter} from '@tanstack/router-plugin/vite'
import wasm from "vite-plugin-wasm";
import sri from 'vite-plugin-sri'
import path from "path"


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
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "./src"),
            },
        },
        plugins: [
            tailwindcss(),
            react(),
            VitePWA({
                    strategies: "injectManifest",
                    srcDir: "src/sw/worker",
                    filename: "sw.ts",
                    registerType: 'autoUpdate',
                    // strategies: "generateSW",
                    includeManifestIcons: true,
                    injectManifest: {
                        minify: false,
                        sourcemap: true,
                        // This increase the cache limit to 8mB
                        maximumFileSizeToCacheInBytes: 1024 * 1024 * 8,
                        // Ensure index.html is included in the manifest
                        // globPatterns: ["**/*.{js,css,html,ico,png,svg,json,woff,woff2}"],
                    },
                    workbox: {
                        maximumFileSizeToCacheInBytes: 1024 * 1024 * 8,
                        // gerados no diretório de build (dist).
                        globPatterns: ["**/*.{js,css,html,ico,png,svg,json,woff,woff2,wasm}"],

                        // Garante que o novo service worker assuma o controle imediatamente
                        clientsClaim: true,
                        skipWaiting: true,
                    },
                    devOptions: {
                        enabled: true,
                        type: "module",
                        navigateFallback: "index.html",
                    },
                    manifest: {
                        name: env.VITE_APP_DESCRIPTION,
                        start_url: "/",
                        scope: "/",
                        short_name: env.VITE_APP_NAME,
                        icons: [
                            {
                                src: "/favicon.svg",
                                type: "image/svg+xml",
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
            wasm(),
            sri(),
        ],
        build: {
            sourcemap: false, //True to generate sourcemaps for debugging
            cssMinify: true,
            minify: true,
            cssCodeSplit: true,
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (checkDependency(id, chunkVideo)) {
                            return 'video'
                        }

                        if (id.includes('node_modules') && !checkDependency(id, [...chunkVideo])) {
                            return 'vendor'
                        }
                    }
                },
                cache: true
            },
        },
    };
});