"use client";

import { useModalStore } from "./modal-state";
import { ResponsiveModal } from "./ResponsiveModal";
import { useEffect, useState } from "react";

export const Modstr = () => {
  const { modals, removeModal } = useModalStore();
  const [isMounted, setIsMounted] = useState(false);

  // Evita problemas de hidratação garantindo que só roda no cliente
  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <>
      {modals.map((modal) => (
        <ResponsiveModal
          key={modal.id}
          modal={modal}
          isOpen={true} // O modal existe no array, logo está aberto
          onOpenChange={(open) => {
            if (!open) {
              removeModal(modal.id);
              if (modal.onClose) modal.onClose();
            }
          }}
        />
      ))}
    </>
  );
};