import { Time } from '@vidstack/react'

export function TimeGroup() {
  return (
    <div className="ml-2.5 flex items-center text-sm font-medium text-white drop-shadow">
      <Time className="time" type="current" />
      <div className="mx-1 text-white/75">/</div>
      <Time className="time" type="duration" />
    </div>
  )
}
