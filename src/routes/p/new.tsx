import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/p/new')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/p/new"!</div>
}
