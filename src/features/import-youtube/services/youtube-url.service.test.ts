import { describe, expect, it } from 'vitest'
import { buildYouTubeThumbnailUrl, buildYouTubeWatchUrl, extractYouTubeVideoId } from './youtube-url.service'

describe('youtube-url.service', () => {
  it.each([
    ['https://www.youtube.com/watch?v=GHvYoKHmtGU'],
    ['https://youtube.com/watch?v=GHvYoKHmtGU'],
    ['https://youtube.com/watch?feature=share&v=GHvYoKHmtGU'],
    ['https://youtu.be/GHvYoKHmtGU'],
    ['https://www.youtube.com/embed/GHvYoKHmtGU'],
    ['https://www.youtube.com/v/GHvYoKHmtGU'],
    ['https://www.youtube.com/shorts/GHvYoKHmtGU'],
    ['https://www.youtube-nocookie.com/embed/GHvYoKHmtGU'],
  ])('extracts the 11-character ID from %s', (url) => {
    expect(extractYouTubeVideoId(url)).toBe('GHvYoKHmtGU')
  })

  it.each([
    [''],
    ['https://example.com/watch?v=GHvYoKHmtGU'],
    ['https://www.youtube.com/watch?v=short'],
    ['https://www.youtube.com/watch?v=GHvYoKHmtGUextra'],
    ['not a url'],
  ])('returns null for invalid URL %s', (url) => {
    expect(extractYouTubeVideoId(url)).toBeNull()
  })

  it('builds canonical YouTube URLs', () => {
    expect(buildYouTubeWatchUrl('GHvYoKHmtGU')).toBe('https://www.youtube.com/watch?v=GHvYoKHmtGU')
    expect(buildYouTubeThumbnailUrl('GHvYoKHmtGU')).toBe('https://i.ytimg.com/vi/GHvYoKHmtGU/hqdefault.jpg')
  })
})
