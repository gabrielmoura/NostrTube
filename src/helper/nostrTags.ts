export type NostrTag = string[]

/**
 * Returns the first tag with the requested name.
 */
export function getTag(tags: NostrTag[], name: string): NostrTag | undefined {
  return tags.find((tag) => tag[0] === name)
}

/**
 * Returns the first value for a tag name, equivalent to `tag[1]`.
 */
export function getTagValue(name: string, tags: NostrTag[]): string | undefined {
  return getTag(tags, name)?.[1]
}

/**
 * Returns all first values for a tag name, skipping tags without values.
 */
export function getTagValues(name: string, tags: NostrTag[]): string[] {
  return tags.filter((tag) => tag[0] === name && tag[1]).map((tag) => tag[1])
}

/**
 * Returns every tag whose first element matches the requested name.
 */
export function getTags(name: string, tags: NostrTag[]): NostrTag[] {
  return tags.filter((tag) => tag[0] === name)
}
