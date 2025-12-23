import { useShallow } from "zustand/react/shallow";
import { useVideoUploadStore } from "./useVideoUploadStore.ts";

export const useVideoUpload = () => {
  return useVideoUploadStore(
    useShallow((state) => ({
      ...state // Retorna tudo com proteção contra re-renders desnecessários
    }))
  );
};