// components/modal/manager.ts
import { type ModalOptions, useModalStore } from "./modal-state";

const generateId = () => Math.random().toString(36).substring(2, 9);

export const modal = {
  /**
   * Exibe um modal.
   * @param content O componente React a ser renderizado.
   * @param options (Opcional) Opções de UI: title, description, className, onClose,id manual, preventClose.
   */
  show: (
    content: React.ReactNode,
    options?: ModalOptions
  ) => {
    const id = options?.id ?? generateId();

    // Default é false
    const preventClose = options?.preventClose ?? false;

    useModalStore.getState().addModal({
      id,
      content,
      preventClose, // Adiciona ao estado
      ...options
    });

    return id;
  },

  dismiss: (id: string) => {
    useModalStore.getState().removeModal(id);
  },

  dismissAll: () => {
    useModalStore.getState().clearModals();
  }
};