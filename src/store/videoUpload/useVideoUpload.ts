import { useShallow } from "zustand/react/shallow";
import { useVideoUploadStore } from "./useVideoUploadStore.ts";

/**
 * Hook para acessar o estado de upload de vídeo.
 * O uso do useShallow garante que o componente só re-renderize
 * se as propriedades de nível superior do store realmente mudarem.
 */
export const useVideoUpload = () => {
  return useVideoUploadStore(
    useShallow((state) => ({
      // Dados
      videoData: state.videoData,
      isUploading: state.isUploading,
      uploadProgress: state.uploadProgress,
      uploadStage: state.uploadStage,
      error: state.error,
      showEventInput: state.showEventInput
    }))
  );
};