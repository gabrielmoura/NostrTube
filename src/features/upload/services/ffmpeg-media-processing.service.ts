import { LoggerAgent } from '@/lib/debug.ts'

const logger = LoggerAgent.create('ffmpeg-media-processing')

export interface FFmpegPreparedVideo {
  file?: File
  thumbnailFile?: File
  thumbnailPreviewUrl?: string
  width?: number
  height?: number
  duration?: number
  mimeType?: string
}

let ffmpegPromise: Promise<import('@ffmpeg/ffmpeg').FFmpeg> | null = null

async function getFFmpeg() {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const [{ FFmpeg }, { fetchFile }] = await Promise.all([import('@ffmpeg/ffmpeg'), import('@ffmpeg/util')])

      const ffmpeg = new FFmpeg()
      await ffmpeg.load()

      Object.assign(ffmpeg, { __fetchFile: fetchFile })
      return ffmpeg
    })().catch((error) => {
      ffmpegPromise = null
      throw error
    })
  }

  return ffmpegPromise
}

export async function isFFmpegAvailable() {
  try {
    await getFFmpeg()
    return true
  } catch (error) {
    logger.warn('ffmpeg unavailable', error)
    return false
  }
}

function toFile(data: Uint8Array, filename: string, type: string) {
  return new File([data], filename, { type })
}

function getOutputStem(name: string) {
  return name.replace(/\.[^.]+$/, '')
}

export async function processVideoWithFFmpeg(
  file: File,
  { preferCompression = false }: { preferCompression?: boolean } = {},
): Promise<FFmpegPreparedVideo | null> {
  try {
    const ffmpeg = await getFFmpeg()
    const fetchFile = (ffmpeg as typeof ffmpeg & { __fetchFile: (value: File) => Promise<Uint8Array> }).__fetchFile
    const inputName = `input-${crypto.randomUUID()}.${file.name.split('.').pop() || 'mp4'}`
    const outputName = `${getOutputStem(file.name)}-optimized.mp4`
    const thumbName = `${getOutputStem(file.name)}-thumbnail.jpg`
    const probeName = `${getOutputStem(file.name)}-probe.json`

    await ffmpeg.writeFile(inputName, await fetchFile(file))

    await ffmpeg.ffprobe([
      '-v',
      'error',
      '-print_format',
      'json',
      '-show_entries',
      'stream=width,height:format=duration',
      inputName,
      '-o',
      probeName,
    ])

    const probeBytes = await ffmpeg.readFile(probeName)
    const probeText = new TextDecoder().decode(probeBytes as Uint8Array)
    const probe = JSON.parse(probeText) as {
      streams?: Array<{ width?: number; height?: number }>
      format?: { duration?: string }
    }

    const stream = probe.streams?.find((item) => item.width && item.height)
    const duration = Number.parseFloat(probe.format?.duration || '0') || undefined
    const width = stream?.width
    const height = stream?.height

    await ffmpeg.exec([
      '-ss',
      duration && duration > 2 ? '2' : '0',
      '-i',
      inputName,
      '-frames:v',
      '1',
      '-q:v',
      '2',
      thumbName,
    ])

    const thumbBytes = await ffmpeg.readFile(thumbName)
    const thumbnailFile = toFile(thumbBytes as Uint8Array, thumbName, 'image/jpeg')

    let outputFile: File | undefined
    if (preferCompression) {
      await ffmpeg.exec([
        '-i',
        inputName,
        '-vf',
        'scale=min(1280,iw):-2',
        '-c:v',
        'libx264',
        '-preset',
        'veryfast',
        '-crf',
        '30',
        '-movflags',
        '+faststart',
        '-c:a',
        'aac',
        '-b:a',
        '128k',
        outputName,
      ])

      const outputBytes = await ffmpeg.readFile(outputName)
      outputFile = toFile(outputBytes as Uint8Array, outputName, 'video/mp4')
    }

    await Promise.allSettled([
      ffmpeg.deleteFile(inputName),
      ffmpeg.deleteFile(thumbName),
      ffmpeg.deleteFile(probeName),
      preferCompression ? ffmpeg.deleteFile(outputName) : Promise.resolve(true),
    ])

    return {
      file: outputFile,
      thumbnailFile,
      thumbnailPreviewUrl: URL.createObjectURL(thumbnailFile),
      width,
      height,
      duration,
      mimeType: outputFile?.type,
    }
  } catch (error) {
    logger.warn('ffmpeg processing failed', error)
    return null
  }
}
