import { Route as rootRoute } from '@/routes/__root'
import { Route as configurationRoute } from '@/routes/configuration/index'
import { Route as debugRoute } from '@/routes/debug/index'
import { Route as faqRoute } from '@/routes/faq/index'
import { Route as indexRoute } from '@/routes/index'
import { Route as newRoute } from '@/routes/new/index'
import { Route as playlistRoute } from '@/routes/p/$listId'
import { Route as playlistNewRoute } from '@/routes/p/new'
import { Route as searchRoute } from '@/routes/search/index'
import { Route as termsRoute } from '@/routes/terms/index'
import { Route as userRoute } from '@/routes/u/$userId'
import { Route as userEditRoute } from '@/routes/u_/$userId/edit'
import { Route as videoRoute } from '@/routes/v/$eventId'
import { Route as videoEditRoute } from '@/routes/v_/$eventId/edit'

export const routeTree = rootRoute.addChildren([
  indexRoute,
  searchRoute,
  newRoute,
  termsRoute,
  faqRoute,
  debugRoute,
  configurationRoute,
  videoRoute,
  videoEditRoute,
  userRoute,
  userEditRoute,
  playlistNewRoute,
  playlistRoute,
])
