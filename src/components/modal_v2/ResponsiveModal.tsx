import { useMediaQuery } from "./use-media-query";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./Dialog"; // Seus componentes existentes
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "./Drawer"; // Seus componentes existentes
import { type ModalType } from "./modal-state";

interface ResponsiveModalProps {
  modal: ModalType;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ResponsiveModal({ modal, isOpen, onOpenChange }: ResponsiveModalProps) {
  // Tailwind 4 / Mobile-first approach
  const isDesktop = useMediaQuery("(min-width: 768px)");

  if (isDesktop) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className={modal.className}>
          {(modal.title || modal.description) && (
            <DialogHeader>
              {modal.title && <DialogTitle>{modal.title}</DialogTitle>}
              {modal.description && <DialogDescription>{modal.description}</DialogDescription>}
            </DialogHeader>
          )}
          {modal.content}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className={modal.className}>
        {(modal.title || modal.description) && (
          <DrawerHeader className="text-left">
            {modal.title && <DrawerTitle>{modal.title}</DrawerTitle>}
            {modal.description && <DrawerDescription>{modal.description}</DrawerDescription>}
          </DrawerHeader>
        )}
        <div className="px-4 pb-4">
          {modal.content}
        </div>
      </DrawerContent>
    </Drawer>
  );
}