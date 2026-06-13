import { useCallback } from 'react'
import { useNDK, useNDKCurrentUser } from '@nostr-dev-kit/ndk-hooks'
import { toast } from 'sonner'
import {
  canUseNip44Drafts,
  clearVideoUploadDraft,
  loadVideoUploadDraft,
  saveVideoUploadDraft,
  type UploadDraftSnapshot,
} from '@/features/upload/services/nip37-draft.service'
import { useVideoUploadStore } from '@/store/videoUpload/useVideoUploadStore'

export function useUploadDraftPersistence() {
  const { ndk } = useNDK()
  const currentUser = useNDKCurrentUser()
  const saveDraftLocal = useVideoUploadStore((state) => state.saveDraft)
  const loadDraftLocal = useVideoUploadStore((state) => state.loadDraft)
  const clearLocalDraft = useVideoUploadStore((state) => state.clearLocalDraft)
  const getDraftSnapshot = useVideoUploadStore((state) => state.getDraftSnapshot)
  const applyDraftSnapshot = useVideoUploadStore((state) => state.applyDraftSnapshot)
  const thumbnailPreviewUrl = useVideoUploadStore((state) => state.thumbnailPreviewUrl)

  const saveDraft = useCallback(async () => {
    const base = getDraftSnapshot()
    const snapshot: UploadDraftSnapshot = {
      ...base,
      thumbnailPreviewUrl,
    }

    saveDraftLocal()

    if (!ndk || !currentUser || !(await canUseNip44Drafts(ndk))) {
      toast.success('Rascunho salvo localmente')
      return snapshot
    }

    try {
      await saveVideoUploadDraft({ ndk, currentUser, snapshot })
      toast.success('Rascunho salvo na rede e localmente')
    } catch {
      toast.success('Rascunho salvo localmente')
    }

    return snapshot
  }, [currentUser, getDraftSnapshot, ndk, saveDraftLocal, thumbnailPreviewUrl])

  const restoreDraft = useCallback(async () => {
    let localSnapshot: UploadDraftSnapshot | null = null
    try {
      loadDraftLocal()
      localSnapshot = getDraftSnapshot()
    } catch {
      localSnapshot = null
    }

    if (!ndk || !currentUser || !(await canUseNip44Drafts(ndk))) {
      return localSnapshot
    }

    try {
      const remoteSnapshot = await loadVideoUploadDraft({ ndk, currentUser })
      const chosen = [localSnapshot, remoteSnapshot]
        .filter(Boolean)
        .sort((a, b) => (b?.updatedAt || 0) - (a?.updatedAt || 0))[0]

      if (chosen) {
        applyDraftSnapshot(chosen)
      }

      return chosen
    } catch {
      return localSnapshot
    }
  }, [applyDraftSnapshot, currentUser, getDraftSnapshot, loadDraftLocal, ndk])

  const clearDraft = useCallback(async () => {
    clearLocalDraft()
    if (!ndk || !currentUser || !(await canUseNip44Drafts(ndk))) {
      return
    }

    try {
      await clearVideoUploadDraft({ ndk, currentUser })
    } catch {
      // local clear already happened; remote cleanup is best effort.
    }
  }, [clearLocalDraft, currentUser, ndk])

  return { saveDraft, restoreDraft, clearDraft }
}
