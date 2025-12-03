// components/modal/store.ts
import { create } from "zustand";
import { devtools } from "zustand/middleware";
import { type ReactNode } from "react";

// 1. Definição do Objeto completo no Estado
export type ModalType = {
  id: string;
  content: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  onClose?: () => void;
  preventClose?: boolean;
};

// 2. Opções de UI (2º Parâmetro)
// Tudo que é visual ou callback, exceto ID e Content
export type ModalOptions = Omit<ModalType,  "content">;


type ModalStore = {
  modals: ModalType[];
  addModal: (modal: ModalType) => void;
  removeModal: (id: string) => void;
  clearModals: () => void;
};

export const useModalStore = create<ModalStore>()(
  devtools(
    (set) => ({
      modals: [],
      addModal: (modal) =>
        set(
          (state) => {
            // Opcional: Evitar duplicatas se o ID já existir
            const exists = state.modals.some(m => m.id === modal.id);
            if (exists) return state;

            return { modals: [...state.modals, modal] };
          },
          false,
          "modal/add"
        ),
      removeModal: (id) =>
        set(
          (state) => ({ modals: state.modals.filter((m) => m.id !== id) }),
          false,
          "modal/remove"
        ),
      clearModals: () => set({ modals: [] }, false, "modal/clear")
    }),
    {
      name: "Modal Store",
      enabled: import.meta.env.DEV
    }
  )
);