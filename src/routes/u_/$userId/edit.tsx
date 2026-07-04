import { createRoute } from '@tanstack/react-router'
import { Route as rootRoute } from '@/routes/__root'
import CreateProfile from '@/routes/u/@components/EditProfile.tsx'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/u/$userId/edit',
  component: CreateProfile,
})
