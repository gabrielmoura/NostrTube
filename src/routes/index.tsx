import { createFileRoute } from '@tanstack/react-router'
import App from "@/pages/home/App.tsx";

export const Route = createFileRoute('/')({
  component: App,
})

