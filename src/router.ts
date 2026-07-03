import { Route as rootRoute } from '@/routes/__root'
import { Route as configurationRoute } from '@/routes/configuration/index'
import { Route as debugRoute } from '@/routes/debug/index'
import { Route as exploreRoute } from '@/routes/explore/index'
import { Route as faqRoute } from '@/routes/faq/index'
import { Route as libraryRoute } from '@/routes/library/index'
import { Route as liveRoute } from '@/routes/live/index'
import { Route as subscriptionsRoute } from '@/routes/subscriptions/index'
import { Route as indexRoute } from '@/routes/index'
import { Route as youtubeImportRoute } from '@/routes/import/youtube'
import { Route as newRoute } from '@/routes/new/index'
import { Route as playlistRoute } from '@/routes/p/$listId'
import { Route as playlistNewRoute } from '@/routes/p/new'
import { Route as blossomRoute } from '@/routes/blossom/index'
import { Route as relaysRoute } from '@/routes/relays/index'
import { Route as searchRoute } from '@/routes/search/index'
import { Route as shortsRoute } from '@/routes/shorts/index'
import { Route as trendingRoute } from '@/routes/trending/index'
import { Route as termsRoute } from '@/routes/terms/index'
import { Route as userRoute } from '@/routes/u/$userId'
import { Route as userEditRoute } from '@/routes/u_/$userId/edit'
import { Route as videoRoute } from '@/routes/v/$eventId'
import { Route as videoEditRoute } from '@/routes/v_/$eventId/edit'
import { Route as zapsRoute } from '@/routes/zaps/index'

export const routeTree = rootRoute.addChildren([
  indexRoute,
  searchRoute,
  shortsRoute,
  youtubeImportRoute,
  newRoute,
  relaysRoute,
  blossomRoute,
  trendingRoute,
  exploreRoute,
  zapsRoute,
  termsRoute,
  faqRoute,
  libraryRoute,
  liveRoute,
  subscriptionsRoute,
  debugRoute,
  configurationRoute,
  videoRoute,
  videoEditRoute,
  userRoute,
  userEditRoute,
  playlistNewRoute,
  playlistRoute,
])
