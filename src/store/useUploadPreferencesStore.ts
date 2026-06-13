import { create } from 'zustand'
import { createJSONStorage, devtools, persist } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export type ThumbnailGenerationMode = 'local' | 'remote'

interface UploadPreferencesState {
  thumbnailGenerationMode: ThumbnailGenerationMode
}

interface UploadPreferencesActions {
  setThumbnailGenerationMode: (mode: ThumbnailGenerationMode) => void
}

export type UploadPreferencesStore = UploadPreferencesState & UploadPreferencesActions

const STORE_NAME = 'upload-preferences'

export const useUploadPreferencesStore = create<UploadPreferencesStore>()(
  devtools(
    persist(
      immer((set) => ({
        thumbnailGenerationMode: 'local',
        setThumbnailGenerationMode: (mode) =>
          set(
            (state) => {
              state.thumbnailGenerationMode = mode
            },
            false,
            'uploadPreferences/setThumbnailGenerationMode',
          ),
      })),
      {
        name: STORE_NAME,
        storage: createJSONStorage(() => localStorage),
      },
    ),
    {
      name: STORE_NAME,
      enabled: import.meta.env.DEV,
    },
  ),
)

export default useUploadPreferencesStore
