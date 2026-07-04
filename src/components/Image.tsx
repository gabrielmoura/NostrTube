import type { DetailedHTMLProps, ImgHTMLAttributes } from 'react'
import { getOptimizedImageSrc } from '@/helper/http.ts'
import useImageProxySettingsStore from '@/store/useImageProxySettingsStore.ts'

interface ImageProps extends DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
  src: string
  alt: string
  width: string | number
}

export function Image({ alt, src, width, ...props }: ImageProps) {
  const imageProxy = useImageProxySettingsStore((state) => state.imageProxy)

  return <img src={getOptimizedImageSrc(src, width, undefined, imageProxy)} alt={alt} width={width} {...props} />
}
