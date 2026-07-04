import { NDKEvent } from '@nostr-dev-kit/ndk'
import { AgeEnum } from '@/store/store/sessionTypes'

const AGE_WEIGHTS: Record<AgeEnum, number> = {
  [AgeEnum.kids]: 0,
  [AgeEnum.teen]: 1,
  [AgeEnum.adult]: 2,
  [AgeEnum.porn]: 3,
}

function getEventAgeWeight(event: NDKEvent): number | undefined {
  const ageTag = event.tags.find((t) => t[0] === 'age')
  if (!ageTag?.[1]) return undefined
  const ageValue = ageTag[1].toLowerCase() as AgeEnum
  return AGE_WEIGHTS[ageValue]
}

export function filterEventsByAge(events: NDKEvent[], agePreference?: AgeEnum): NDKEvent[] {
  if (!agePreference || events.length === 0) return events

  const maxWeight = AGE_WEIGHTS[agePreference]

  return events.filter((event) => {
    const eventWeight = getEventAgeWeight(event)
    if (eventWeight === undefined) return true
    return eventWeight <= maxWeight
  })
}
