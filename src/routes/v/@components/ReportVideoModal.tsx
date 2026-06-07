import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNDK, useNDKCurrentPubkey } from "@nostr-dev-kit/ndk-hooks";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  DrawerBody,
  DrawerClose,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle
} from "@/components/modal_v2/Drawer";
import { Button } from "@/components/ui/button";
import { ButtonWithLoader } from "@/components/ButtonWithLoader";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { modal } from "@/components/modal_v2/modal-manager.ts";
import { reportContentAction, reportTechnicalAction } from "@/helper/actions/report";

interface ReportVideoModelProps {
  data: {
    title?: string;
    id: string;
    authorPubkey: string;
    relayUrls?: string[];
  };
}

const CONTENT_REPORT_CATEGORIES = [
  { value: "spam", label: "Spam" },
  { value: "abusive", label: "Conteúdo abusivo" },
  { value: "duplicate", label: "Duplicado" },
  { value: "other", label: "Outros" }
];

const TECHNICAL_REPORT_CATEGORIES = [
  { value: "video-not-loading", label: "Vídeo não carrega" },
  { value: "cdn-connection-error", label: "Erro de conexão com CDN" },
  { value: "audio-video-desync", label: "Áudio e vídeo dessincronizados" },
  { value: "other", label: "Outro problema técnico" }
];

function ReportOptions({
  options,
  value,
  onChange
}: {
  options: Array<{ value: string; label: string }>;
  value?: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-lg border px-3 py-3 text-left text-sm transition-colors ${value === option.value ? "border-primary bg-primary/5 text-foreground" : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ReportContentModal({ data: { title, id } }: ReportVideoModelProps) {
  const { ndk } = useNDK();
  const pubkey = useNDKCurrentPubkey();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | undefined>();

  const { mutate, isPending } = useMutation({
    mutationKey: ["report-content", id],
    mutationFn: reportContentAction,
    onSuccess: () => {
      toast.success("Sinalização enviada com sucesso.", {
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
      });
      modal.dismissAll();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Falha ao enviar sinalização.", {
        icon: <AlertCircle className="h-4 w-4 text-red-500" />
      });
    }
  });

  return (
    <>
      <DrawerHeader className="text-left">
        <DrawerTitle className="text-xl font-semibold tracking-tight">Reportar violação de conteúdo</DrawerTitle>
        <p className="text-sm text-muted-foreground">{title || "Conteúdo sem título"}</p>
      </DrawerHeader>
      <DrawerBody className="space-y-6 pt-4">
        <div className="space-y-2">
          <Label>Categoria</Label>
          <ReportOptions options={CONTENT_REPORT_CATEGORIES} value={category} onChange={setCategory} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="content-report-description">Detalhes adicionais</Label>
          <Textarea id="content-report-description" value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-[100px] resize-none" />
        </div>
      </DrawerBody>
      <DrawerFooter className="flex-row gap-3 pt-4 border-t mt-4">
        <DrawerClose asChild>
          <Button variant="outline" className="flex-1">Cancelar</Button>
        </DrawerClose>
        <ButtonWithLoader
          className="flex-1"
          variant="destructive"
          isLoading={isPending}
          disabled={!category || !pubkey || !ndk}
          onClick={() => category && pubkey && ndk && mutate({ ndk, id, pubkey, description, category })}
        >
          Enviar sinalização
        </ButtonWithLoader>
      </DrawerFooter>
    </>
  );
}

export function ReportTechnicalModal({ data: { title, id, authorPubkey, relayUrls } }: ReportVideoModelProps) {
  const { ndk } = useNDK();
  const pubkey = useNDKCurrentPubkey();
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string | undefined>();

  const { mutate, isPending } = useMutation({
    mutationKey: ["report-technical", id],
    mutationFn: reportTechnicalAction,
    onSuccess: () => {
      toast.success("Problema técnico notificado com sucesso.", {
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />
      });
      modal.dismissAll();
    },
    onError: (error) => {
      console.error(error);
      toast.error("Falha ao notificar problema técnico.", {
        icon: <AlertCircle className="h-4 w-4 text-red-500" />
      });
    }
  });

  return (
    <>
      <DrawerHeader className="text-left">
        <DrawerTitle className="text-xl font-semibold tracking-tight">Notificar problema no player/vídeo</DrawerTitle>
        <p className="text-sm text-muted-foreground">{title || "Conteúdo sem título"}</p>
      </DrawerHeader>
      <DrawerBody className="space-y-6 pt-4">
        <div className="space-y-2">
          <Label>Tipo de problema</Label>
          <ReportOptions options={TECHNICAL_REPORT_CATEGORIES} value={category} onChange={setCategory} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="technical-report-description">Detalhes adicionais</Label>
          <Textarea id="technical-report-description" value={description} onChange={(event) => setDescription(event.target.value)} className="min-h-[100px] resize-none" />
        </div>
      </DrawerBody>
      <DrawerFooter className="flex-row gap-3 pt-4 border-t mt-4">
        <DrawerClose asChild>
          <Button variant="outline" className="flex-1">Cancelar</Button>
        </DrawerClose>
        <ButtonWithLoader
          className="flex-1"
          variant="default"
          isLoading={isPending}
          disabled={!category || !pubkey || !ndk}
          onClick={() => category && pubkey && ndk && mutate({ ndk, id, pubkey, description, category, authorPubkey, relayUrls })}
        >
          Notificar autor
        </ButtonWithLoader>
      </DrawerFooter>
    </>
  );
}
