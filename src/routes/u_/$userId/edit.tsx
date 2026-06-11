import { createRoute } from "@tanstack/react-router";
import CreateProfile from "@/routes/u/@components/EditProfile.tsx";
import { Route as rootRoute } from "@/routes/__root";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/u/$userId/edit",
  component: CreateProfile
});
