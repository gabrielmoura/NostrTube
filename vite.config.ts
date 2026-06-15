import { sentryVitePlugin } from '@sentry/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import legacy from '@vitejs/plugin-legacy'
import react from '@vitejs/plugin-react'
import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
// @ts-expect-error vite-plugin-sri does not publish types.
import sri from 'vite-plugin-sri'
import envSchemaValidate from './envSchema.ts'

export default defineConfig(({ mode }) => {
  // Load environment variables based on the current mode
  const env = loadEnv(mode, process.cwd(), '') // The third argument is the prefix for client-side variables (e.g., 'VITE_')
  function includesAny(id: string, patterns: string[]): boolean {
    return patterns.some((pattern) => id.includes(pattern))
  }

  function getManualChunk(id: string) {
    if (id.includes('node_modules/@vidstack/react') || id.includes('hls.js') || id.includes('dashjs')) {
      return 'video'
    }

    if (
      includesAny(id, [
        '/src/routes/debug/',
        '/src/features/debug/',
        'node_modules/recharts/',
        'node_modules/@nostr-dev-kit/ndk-cache-dexie/',
      ])
    ) {
      return 'route-debug'
    }

    if (
      includesAny(id, [
        '/src/routes/new/',
        '/src/features/upload/',
        '/src/store/videoUpload/',
        '/src/components/VideoUpload/',
        '/src/hooks/useVideoUploader',
        '/src/hooks/useBlossomUpload',
        'node_modules/blossom-client-sdk/',
        'node_modules/react-dropzone/',
      ])
    ) {
      return 'route-new'
    }

    if (includesAny(id, ['/src/routes/configuration/', 'node_modules/ngeohash/'])) {
      return 'route-configuration'
    }

    if (
      includesAny(id, [
        'node_modules/@nostr-dev-kit/ndk/',
        'node_modules/@nostr-dev-kit/ndk-hooks/',
        'node_modules/@nostr-dev-kit/react/',
      ])
    ) {
      return 'ndk-core'
    }

    if (includesAny(id, ['node_modules/@nostr-dev-kit/messages/', 'node_modules/@nostr-dev-kit/ndk-blossom/'])) {
      return 'ndk-extensions'
    }

    if (includesAny(id, ['node_modules/nostr-tools/nip19', 'node_modules/nostr-tools/', 'node_modules/@noble/'])) {
      return 'nostr-utils'
    }

    if (
      includesAny(id, [
        'node_modules/dexie/',
        'node_modules/idb/',
        'node_modules/@nostr-dev-kit/ndk-cache-dexie/',
        'node_modules/@nostr-dev-kit/ndk-cache-sqlite-wasm/',
      ])
    ) {
      return 'nostr-storage'
    }

    if (id.includes('node_modules/nostr-wasm/')) {
      return 'nostr-wasm'
    }

    if (includesAny(id, ['node_modules/@radix-ui/', 'node_modules/cmdk/', 'node_modules/vaul/'])) {
      return 'ui-kit'
    }

    if (
      includesAny(id, [
        'node_modules/@tanstack/',
        'node_modules/zod/',
        'node_modules/@hookform/resolvers/',
        'node_modules/react-hook-form/',
      ])
    ) {
      return 'app-core'
    }

    if (includesAny(id, ['node_modules/react/', 'node_modules/react-dom/', 'node_modules/scheduler/'])) {
      return 'react-core'
    }

    if (id.includes('node_modules/')) {
      return 'vendor-misc'
    }

    return undefined
  }

  const sentryEnabled = Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT)
  const shouldGenerateSourcemap = sentryEnabled || env.VITE_BUILD_SOURCEMAP === 'true'

  return {
    define: {
      global: 'globalThis',
    },
    resolve: {
      tsconfigPaths: true,
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    plugins: [
      tailwindcss(),
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src/sw/worker',
        filename: 'sw.ts',
        registerType: 'autoUpdate',
        // strategies: "generateSW",
        includeManifestIcons: true,
        injectManifest: {
          minify: false,
          sourcemap: shouldGenerateSourcemap,
          // This increase the cache limit to 8mB
          maximumFileSizeToCacheInBytes: 1024 * 1024 * 8,
          globIgnores: ['**/route-debug*.js', '**/route-debug*.js.map'],
          // Ensure index.html is included in the manifest
          // globPatterns: ["**/*.{js,css,html,ico,png,svg,json,woff,woff2}"],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 1024 * 1024 * 8,
          // gerados no diretório de build (dist).
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2,wasm}'],
          globIgnores: ['**/route-debug*.js', '**/route-debug*.js.map'],

          // Garante que o novo service worker assuma o controle imediatamente
          clientsClaim: true,
          skipWaiting: true,
        },
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: 'index.html',
        },
        manifest: {
          name: env.VITE_APP_DESCRIPTION,
          start_url: '/',
          scope: '/',
          short_name: env.VITE_APP_NAME,
          icons: [
            {
              src: '/favicon.svg',
              type: 'image/svg+xml',
            },
          ],
          categories: ['social'],
          protocol_handlers: [
            {
              protocol: 'web+nostr',
              url: '/l/%s',
            },
          ],
        },
      }),
      legacy({
        polyfills: ['es.promise.finally', 'es/map', 'es/set'],
        modernPolyfills: ['es.promise.finally'],
        targets: ['defaults', 'not IE 11'],
      }),
      sri(),
      envSchemaValidate(),
      ...(sentryEnabled
        ? [
            sentryVitePlugin({
              authToken: process.env.SENTRY_AUTH_TOKEN,
              org: process.env.SENTRY_ORG,
              project: process.env.SENTRY_PROJECT,
            }),
          ]
        : []),
    ],
    build: {
      sourcemap: sentryEnabled ? 'hidden' : shouldGenerateSourcemap,
      cssMinify: true,
      minify: true,
      cssCodeSplit: true,
      chunkSizeWarningLimit: 1300,
      rolldownOptions: {
        output: {
          chunkFileNames: 'assets/[name]-[hash].js',
          codeSplitting: {
            groups: [
              {
                name(id) {
                  return getManualChunk(id) ?? null
                },
              },
            ],
          },
        },
        cache: true,
      },
    },
  }
})
