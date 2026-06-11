import { createRoute } from "@tanstack/react-router";
import PlaylistScreen from "./@playlist/PlaylistScreen.tsx";
import { Route as rootRoute } from "@/routes/__root";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/p/$listId",
  component: RouteComponent
});

function RouteComponent() {
  return <PlaylistScreen />;
}
