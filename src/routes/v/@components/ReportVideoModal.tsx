import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNDK, useNDKCurrentPubkey } from "@nostr-dev-kit/ndk-hooks";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2 } from "lucide-react";

// Shadcn UI Imports
import {
  DrawerBody,
  DrawerClose,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from "@/components/modal_v2/Drawer";
import { Select, SelectContentNoPortal, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button"; // Botão padrão shadcn para o Cancelar
import { ButtonWithLoader } from "@/components/ButtonWithLoader";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// Helper Action
import { reportVideoAction } from "@/helper/actions/report";
import { modal } from "@/components/modal_v2/modal-manager.ts";

interface ReportVideoModelProps {
  data: {
    title?: string;
    eventIdTag: string; // Não estava sendo usado, mas mantive para tipagem
    id: string;
  };
}

// Opções baseadas no comentário do código original e NIP-56 (Reporting)
const REPORT_CATEGORIES = [
  { value: "profanity", label: "Linguagem Imprópria", description: "Discurso de ódio, ofensas ou violência." },
  { value: "nudity", label: "Nudez ou Conteúdo Sexual", description: "Pornografia ou nudez não solicitada." },
  { value: "spam", label: "Spam", description: "Conteúdo repetitivo, enganoso ou irrelevante." },
  {
    value: "impersonation",
    label: "Falsificação de Identidade",
    description: "Se passando por outra pessoa ou entidade."
  },
  { value: "illegal", label: "Atividades Ilegais", description: "Conteúdo proibido por lei ou perigoso." },
  { value: "malware", label: "Malware ou Vírus", description: "Links ou arquivos maliciosos." }
];

export function ReportVideoModel({ data: { title, id } }: ReportVideoModelProps) {
  const { ndk } = useNDK();
  const pubkey = useNDKCurrentPubkey();

  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | undefined>();

  const { mutate, isPending } = useMutation({
    mutationKey: ["report", id],
    mutationFn: reportVideoAction,
    onSuccess: () => {
      toast.success("Denúncia enviada com sucesso!", {
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
      });
      modal.dismissAll();
    },
    onError: (e) => {
      console.error(e);
      toast.error("Falha ao enviar denúncia. Tente novamente.", {
        icon: <AlertCircle className="h-4 w-4 text-red-500" />
      });
    }
  });

  const handleSubmit = () => {
    if (!category || !pubkey || !ndk) return;

    mutate({
      ndk,
      id,
      pubkey,
      description,
      category
    });
  };

  return (
    <>
      <DrawerHeader className="text-left">
        <DrawerTitle className="text-xl font-semibold tracking-tight">
          Reportar Vídeo
        </DrawerTitle>
        <DrawerDescription className="line-clamp-1 text-muted-foreground">
          {title || "Conteúdo sem título"}
        </DrawerDescription>
      </DrawerHeader>

      <DrawerBody className="space-y-6 pt-4">
        {/* Seleção de Categoria */}
        <div className="space-y-2">
          <Label htmlFor="category-select" className="text-sm font-medium">
            Qual o motivo da denúncia?
          </Label>
          <Select onValueChange={setCategory}>
            <SelectTrigger id="category-select" className="w-full">
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContentNoPortal>
              {REPORT_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  <div className="flex flex-col items-start py-1">
                    <span className="font-medium">{cat.label}</span>
                    {cat.description && (
                      <span className="text-xs text-muted-foreground">
                        {cat.description}
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContentNoPortal>
          </Select>
        </div>

        {/* Descrição / Detalhes */}
        <div className="space-y-2">
          <Label htmlFor="description-area" className="text-sm font-medium">
            Descrição Adicional <span className="text-muted-foreground font-normal">(Opcional)</span>
          </Label>
          <Textarea
            id="description-area"
            placeholder="Forneça mais detalhes para ajudar na análise..."
            className="resize-none min-h-[100px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={500}
          />
          <p className="text-xs text-right text-muted-foreground">
            {description.length}/500
          </p>
        </div>
      </DrawerBody>

      <DrawerFooter className="flex-row gap-3 pt-4 border-t mt-4">
        <DrawerClose asChild>
          <Button variant="outline" className="flex-1">
            Cancelar
          </Button>
        </DrawerClose>

        <ButtonWithLoader
          className="flex-1"
          variant="destructive" // Destructive chama atenção para ação de denúncia
          isLoading={isPending}
          disabled={!category || !pubkey || isPending}
          onClick={handleSubmit}
        >
          {isPending ? "Enviando..." : "Reportar"}
        </ButtonWithLoader>
      </DrawerFooter>
    </>
  );
}