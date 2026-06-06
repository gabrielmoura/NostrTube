import type { eventSearchType } from "@/helper/loaders/getVideosFromSearchData";

export type SearchChipType = "tag" | "lang" | "author";

export interface SearchChipToken {
  type: SearchChipType;
  value: string;
  label: string;
}

export interface ParsedSearchInput {
  freeText: string;
  chips: SearchChipToken[];
}

const TOKEN_PATTERN = /(?:^|\s)(lang|tag|author):([^\s]+)/gi;

function normalizeChip(type: SearchChipType, value: string): SearchChipToken | null {
  const normalizedValue = value.trim();
  if (!normalizedValue) return null;

  return {
    type,
    value: normalizedValue,
    label: `${type}:${normalizedValue}`
  };
}

export function parseSearchInput(rawInput: string): ParsedSearchInput {
  const chips: SearchChipToken[] = [];
  const consumedRanges: Array<{ start: number; end: number }> = [];

  for (const match of rawInput.matchAll(TOKEN_PATTERN)) {
    const type = match[1] as SearchChipType;
    const value = match[2] ?? "";
    const token = normalizeChip(type, value);
    if (!token) continue;
    chips.push(token);
    const start = match.index ?? 0;
    consumedRanges.push({ start, end: start + match[0].length });
  }

  const freeText = consumedRanges.length
    ? consumedRanges
      .sort((a, b) => a.start - b.start)
      .reduceRight((acc, range) => `${acc.slice(0, range.start)} ${acc.slice(range.end)}`, rawInput)
      .replace(/\s+/g, " ")
      .trim()
    : rawInput.trim();

  return { freeText, chips };
}

export function buildSearchStateFromInput(input: string, existing: Pick<eventSearchType, "author" | "lang" | "tag"> = {}) {
  const parsed = parseSearchInput(input);
  const tags = [
    ...(Array.isArray(existing.tag) ? existing.tag : existing.tag ? [existing.tag] : []),
    ...parsed.chips.filter((chip) => chip.type === "tag").map((chip) => chip.value)
  ];

  const uniqueTags = Array.from(new Set(tags));
  const langChip = parsed.chips.find((chip) => chip.type === "lang");
  const authorChip = parsed.chips.find((chip) => chip.type === "author");

  return {
    search: parsed.freeText,
    tag: uniqueTags,
    lang: langChip?.value ?? existing.lang,
    author: authorChip?.value ?? existing.author,
    chips: [
      ...uniqueTags.map((value) => ({ type: "tag" as const, value, label: `tag:${value}` })),
      ...(langChip?.value ?? existing.lang ? [{ type: "lang" as const, value: langChip?.value ?? existing.lang!, label: `lang:${langChip?.value ?? existing.lang}` }] : []),
      ...(authorChip?.value ?? existing.author ? [{ type: "author" as const, value: authorChip?.value ?? existing.author!, label: `author:${authorChip?.value ?? existing.author}` }] : [])
    ]
  };
}

export function buildInputFromSearchState(searchParams: Pick<eventSearchType, "search" | "author" | "lang" | "tag">): string {
  const tags = Array.isArray(searchParams.tag) ? searchParams.tag : searchParams.tag ? [searchParams.tag] : [];
  const pieces = [searchParams.search, ...tags.map((tag) => `tag:${tag}`), searchParams.lang ? `lang:${searchParams.lang}` : "", searchParams.author ? `author:${searchParams.author}` : ""];
  return pieces.filter(Boolean).join(" ").trim();
}
