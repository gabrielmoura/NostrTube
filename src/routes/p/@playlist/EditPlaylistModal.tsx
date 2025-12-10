import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { type Playlist } from "./types";

interface EditPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlist: Playlist;
  onSave: (updatedMeta: Partial<Playlist>) => void;
}

export const EditPlaylistModal = ({ isOpen, onClose, playlist, onSave }: EditPlaylistModalProps) => {
  const [formData, setFormData] = useState({
    name: playlist.name,
    description: playlist.description,
    coverImage: playlist.coverImage || ""
  });

  // Reset form when playlist changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: playlist.name,
        description: playlist.description,
        coverImage: playlist.coverImage || ""
      });
    }
  }, [isOpen, playlist]);

  const handleSubmit = () => {
    onSave(formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Playlist</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="desc">Descrição</Label>
            <Textarea
              id="desc"
              value={formData.description}
              maxLength={500}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
            {formData?.description && <p className="text-xs text-right text-muted-foreground">
              {formData?.description.length}/500
            </p>}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="image">URL da Imagem de Capa</Label>
            <Input
              id="image"
              value={formData.coverImage}
              onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSubmit}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};