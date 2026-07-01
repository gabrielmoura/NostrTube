import { createRoute } from '@tanstack/react-router'
import { t } from 'i18next'
import { BlossomExplorerPage } from '@/features/blossom/BlossomExplorerPage'
import { Route as rootRoute } from '@/routes/__root'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/blossom',
  component: BlossomExplorerPage,
  head: () => ({
    meta: [
      { title: t('blossom_page_title', 'Blossom - NostrTube') },
      {
        name: 'description',
        content: t('blossom_page_desc', 'Armazene e gerencie arquivos com Blossom no ecossistema Nostr.'),
      },
    ],
  }),
})
