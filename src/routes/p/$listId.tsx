import { createRoute, redirect } from "@tanstack/react-router";
import { nip19 } from "nostr-tools";
import PlaylistScreen from "./@playlist/PlaylistScreen.tsx";
import { Route as rootRoute } from "@/routes/__root";

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: "/p/$listId",
  beforeLoad: ({ params: { listId } }) => {
    if (!listId.startsWith("naddr")) return;

    const { type, data } = nip19.decode(listId);
    if (type !== "naddr") return;

    const address = data as nip19.AddressPointer;
    throw redirect({
      to: "/p/$listId",
      params: { listId: address.identifier },
      replace: true
    });
  },
  component: RouteComponent
});

function RouteComponent() {
  return <PlaylistScreen />;
}
