import { createFileRoute } from "@tanstack/react-router";
import CreateProfile from "@/routes/u/@components/EditProfile.tsx";

export const Route = createFileRoute("/u_/$userId/edit")({
  component: CreateProfile
});