/**
 * A raw Nostr tag tuple.
 *
 * Nostr represents tags as arrays where the first item is the tag name and
 * subsequent items are tag-specific values. For example:
 * `["title", "My video"]` or `["imeta", "url https://...", "m video/mp4"]`.
 */
export type NostrTag = string[]

/**
 * Minimal unsigned Nostr event shape used by local event builders.
 *
 * This keeps constructors local without pulling a utility package for
 * structural typing only.
 */
export interface StampedEvent {
  kind: number
  content: string
  tags: NostrTag[]
  created_at: number
  pubkey?: string
}

/**
 * Returns the first tag with the requested name.
 *
 * @param tags - Raw Nostr tag list to inspect.
 * @param name - Tag name to match against `tag[0]`.
 * @returns The first matching tag tuple, or `undefined` when absent.
 */
export function getTag(tags: NostrTag[], name: string): NostrTag | undefined {
  return tags.find((tag) => tag[0] === name)
}

/**
 * Returns the first value for a tag name, equivalent to `tag[1]`.
 *
 * @param name - Tag name to match against `tag[0]`.
 * @param tags - Raw Nostr tag list to inspect.
 * @returns The first matching tag value, or `undefined` when absent.
 */
export function getTagValue(name: string, tags: NostrTag[]): string | undefined {
  return getTag(tags, name)?.[1]
}

/**
 * Returns all first values for a tag name, skipping tags without values.
 *
 * @param name - Tag name to match against `tag[0]`.
 * @param tags - Raw Nostr tag list to inspect.
 * @returns First values from every matching tag that has a value.
 */
export function getTagValues(name: string, tags: NostrTag[]): string[] {
  return tags.filter((tag) => tag[0] === name && tag[1]).map((tag) => tag[1])
}

/**
 * Returns every tag whose first element matches the requested name.
 *
 * @param name - Tag name to match against `tag[0]`.
 * @param tags - Raw Nostr tag list to inspect.
 * @returns All matching tag tuples in their original order.
 */
export function getTags(name: string, tags: NostrTag[]): NostrTag[] {
  return tags.filter((tag) => tag[0] === name)
}
