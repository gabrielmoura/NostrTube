import { useThrottledCallback } from '@tanstack/react-pacer'

export function useThrottledProgress(setProgress: (progress: number) => void, wait = 100, key?: string) {
  return useThrottledCallback(
    (loaded: number, total: number) => {
      const percentage = total > 0 ? Math.min(Math.round((loaded / total) * 100), 100) : 0
      setProgress(percentage)
    },
    { wait, key },
  )
}
