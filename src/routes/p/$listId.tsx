import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/p/$listId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/p/$listId"!</div>
}
