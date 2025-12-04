import { createFileRoute } from "@tanstack/react-router";
import PlaylistScreen from "./@playlist/PlaylistScreen.tsx";

export const Route = createFileRoute("/p/$listId")({
  component: RouteComponent
});

function RouteComponent() {
  return <PlaylistScreen />;
}
