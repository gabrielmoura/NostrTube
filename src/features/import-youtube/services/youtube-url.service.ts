const videoIdRE =
  /(?:youtu\.be|youtube|youtube\.com|youtube-nocookie\.com)(?:\/shorts)?\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|)((?:\w|-){11})/

export function extractYouTubeVideoId(url: string): string | null {
  const normalizedUrl = url.trim()
  const match = videoIdRE.exec(normalizedUrl)
  const nextCharacter = match ? normalizedUrl[match.index + match[0].length] : undefined
  if (nextCharacter && /[\w-]/.test(nextCharacter)) {
    return null
  }
  return match?.[1] ?? null
}

export function buildYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`
}

export function buildYouTubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
}
