import { useNDK } from '@nostr-dev-kit/ndk-hooks'
import { createContext, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getDefaultPresetPubkey, normalizePresetPubkey } from '@/features/presets/preset.config'
import { PresetCacheService } from '@/features/presets/services/PresetCacheService'
import { PresetService } from '@/features/presets/services/PresetService'
import { PresetError, type NostubePreset, type PresetState } from '@/features/presets/types/preset'

interface PresetContextValue extends PresetState {
  defaultPresetPubkey: string
  selectPreset: (pubkey: string) => Promise<void>
  refreshPresets: () => Promise<void>
  resetToDefaultPreset: () => Promise<void>
  clearPresetSelection: () => void
}

export const PresetContext = createContext<PresetContextValue | null>(null)

function getInitialSelectedPubkey(defaultPresetPubkey: string) {
  try {
    return PresetCacheService.getSelectedPresetPubkey() ?? defaultPresetPubkey
  } catch (error: unknown) {
    if (import.meta.env.DEV) {
      console.warn('Failed to read selected preset cache', PresetError.fromUnknown(error, 'PRESET_CACHE_FAILED'))
    }
    return defaultPresetPubkey
  }
}

function getInitialCachedPreset(pubkey: string) {
  try {
    return PresetCacheService.getCachedPreset(pubkey)?.preset ?? null
  } catch (error: unknown) {
    if (import.meta.env.DEV) {
      console.warn('Failed to read active preset cache', PresetError.fromUnknown(error, 'PRESET_CACHE_FAILED'))
    }
    return null
  }
}

function getInitialActivePreset(pubkey: string) {
  return getInitialCachedPreset(pubkey)
}

function mergePresets(presets: NostubePreset[], selectedPreset: NostubePreset | null) {
  if (!selectedPreset) return presets
  const withoutSelected = presets.filter((preset) => preset.pubkey !== selectedPreset.pubkey)
  return [selectedPreset, ...withoutSelected]
}

function isPresetNotFound(error: unknown) {
  return error instanceof PresetError && error.code === 'PRESET_NOT_FOUND'
}

export function PresetProvider({ children }: { children: ReactNode }) {
  const defaultPresetPubkey = useMemo(() => getDefaultPresetPubkey(), [])
  const [selectedPresetPubkey, setSelectedPresetPubkey] = useState(() => getInitialSelectedPubkey(defaultPresetPubkey))
  const [activePreset, setActivePreset] = useState<NostubePreset | null>(() =>
    getInitialActivePreset(selectedPresetPubkey),
  )
  const [availablePresets, setAvailablePresets] = useState<NostubePreset[]>(() => mergePresets([], activePreset))
  const [status, setStatus] = useState<PresetState['status']>(() => (activePreset ? 'loaded' : 'idle'))
  const [error, setError] = useState<PresetError | null>(null)
  const [isUsingCachedPreset, setIsUsingCachedPreset] = useState(Boolean(getInitialCachedPreset(selectedPresetPubkey)))
  const activePresetRef = useRef(activePreset)
  const { ndk } = useNDK()

  useEffect(() => {
    activePresetRef.current = activePreset
  }, [activePreset])

  const refreshPresets = useCallback(async () => {
    if (!ndk) {
      setError(new PresetError('NDK is not ready.', 'PRESET_FETCH_FAILED'))
      return
    }

    setStatus((current) => (current === 'loaded' || activePresetRef.current ? 'refreshing' : 'loading'))

    try {
      const presets = await PresetService.listPresets(ndk).catch((listError: unknown) => {
        if (import.meta.env.DEV) {
          console.warn('Failed to list presets', PresetError.fromUnknown(listError, 'PRESET_FETCH_FAILED'))
        }
        return []
      })
      const selectedPreset = await PresetService.fetchPresetByPubkey(ndk, selectedPresetPubkey).catch(
        (fetchError: unknown) => {
          const cached = PresetCacheService.getCachedPreset(selectedPresetPubkey)?.preset
          if (cached) return cached
          if (isPresetNotFound(fetchError)) return null
          throw fetchError
        },
      )

      if (selectedPreset?.createdAt && selectedPreset.createdAt > 0) {
        PresetCacheService.setCachedPreset(selectedPreset)
      }
      presets.forEach((preset) => PresetCacheService.setCachedPreset(preset))
      setActivePreset(selectedPreset)
      setAvailablePresets(mergePresets(presets, selectedPreset))
      setIsUsingCachedPreset(false)
      setError(null)
      setStatus('loaded')
    } catch (fetchError: unknown) {
      const presetError = PresetError.fromUnknown(fetchError, 'PRESET_FETCH_FAILED', 'Failed to refresh presets.')
      setError(presetError)
      setStatus(activePresetRef.current ? 'loaded' : 'error')
      setIsUsingCachedPreset(Boolean(activePresetRef.current))

      if (import.meta.env.DEV) {
        console.warn('Failed to refresh presets', presetError)
      }
    }
  }, [ndk, selectedPresetPubkey])

  const selectPreset = useCallback(
    async (pubkey: string) => {
      const normalizedPubkey = normalizePresetPubkey(pubkey)

      if (!normalizedPubkey) {
        throw new PresetError('Invalid preset pubkey.', 'INVALID_PRESET_EVENT')
      }

      setSelectedPresetPubkey(normalizedPubkey)
      PresetCacheService.setSelectedPresetPubkey(normalizedPubkey)

      const cachedPreset = PresetCacheService.getCachedPreset(normalizedPubkey)?.preset ?? null
      if (cachedPreset) {
        setActivePreset(cachedPreset)
        setAvailablePresets((current) => mergePresets(current, cachedPreset))
        setIsUsingCachedPreset(true)
        setStatus('loaded')
      }

      if (!ndk) {
        if (!cachedPreset) {
          setError(new PresetError('NDK is not ready.', 'PRESET_FETCH_FAILED'))
          setStatus('error')
        }
        return
      }

      setStatus(cachedPreset ? 'refreshing' : 'loading')

      try {
        const preset = await PresetService.fetchPresetByPubkey(ndk, normalizedPubkey)
        PresetCacheService.setCachedPreset(preset)
        setActivePreset(preset)
        setAvailablePresets((current) => mergePresets(current, preset))
        setIsUsingCachedPreset(false)
        setError(null)
        setStatus('loaded')
      } catch (selectError: unknown) {
        if (isPresetNotFound(selectError)) {
          setActivePreset(null)
          setIsUsingCachedPreset(false)
          setError(null)
          setStatus('idle')
          return
        }

        const presetError = PresetError.fromUnknown(selectError, 'PRESET_FETCH_FAILED', 'Failed to select preset.')
        setError(presetError)
        setStatus(cachedPreset ? 'loaded' : 'error')
        setIsUsingCachedPreset(Boolean(cachedPreset))
        throw presetError
      }
    },
    [ndk],
  )

  const resetToDefaultPreset = useCallback(async () => {
    await selectPreset(defaultPresetPubkey)
  }, [defaultPresetPubkey, selectPreset])

  const clearPresetSelection = useCallback(() => {
    PresetCacheService.clearSelectedPresetPubkey()
    const cachedDefaultPreset = getInitialActivePreset(defaultPresetPubkey)
    setSelectedPresetPubkey(defaultPresetPubkey)
    setActivePreset(cachedDefaultPreset)
    setAvailablePresets((current) => mergePresets(current, cachedDefaultPreset))
    setIsUsingCachedPreset(Boolean(cachedDefaultPreset))
    setStatus(cachedDefaultPreset ? 'loaded' : 'idle')
  }, [defaultPresetPubkey])

  useEffect(() => {
    if (!ndk) return
    void refreshPresets()
  }, [ndk, refreshPresets])

  const value = useMemo<PresetContextValue>(
    () => ({
      defaultPresetPubkey,
      selectedPresetPubkey,
      activePreset,
      availablePresets,
      status,
      error,
      isUsingCachedPreset,
      selectPreset,
      refreshPresets,
      resetToDefaultPreset,
      clearPresetSelection,
    }),
    [
      activePreset,
      availablePresets,
      clearPresetSelection,
      defaultPresetPubkey,
      error,
      isUsingCachedPreset,
      refreshPresets,
      resetToDefaultPreset,
      selectPreset,
      selectedPresetPubkey,
      status,
    ],
  )

  return <PresetContext.Provider value={value}>{children}</PresetContext.Provider>
}
