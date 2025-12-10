import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ListVideo, MoreVertical, Play, Trash2 } from "lucide-react";
import { type VideoItem } from "./types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

interface PlaylistItemProps {
  item: VideoItem;
  onRemove: (id: string) => void;
  onPlay: (id: string) => void;
  isDragging?: boolean;
}

export const PlaylistItem = ({ item, onRemove, onPlay }: PlaylistItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto"
  };

  const formattedDuration = React.useMemo(() => {
    const minutes = Math.floor(item.duration / 60);
    const seconds = String(item.duration % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }, [item.duration]);

  const formattedDate = React.useMemo(() => {
    return new Date(item.publishedAt).toLocaleDateString(undefined, {
      day: "numeric", month: "short", year: "numeric"
    });
  }, [item.publishedAt]);

  return (
    <div ref={setNodeRef} style={style} className="mb-2 sm:mb-3 touch-none outline-none">
      <Card
        className={cn(
          // Layout Base (Mobile): Padding apertado, gap pequeno
          "flex flex-row items-center p-1.5 gap-2 bg-card transition-shadow hover:shadow-md border-muted/60",
          // Layout Tablet+: Padding maior, gap maior
          "sm:p-2 sm:pr-4 sm:gap-4",
          isDragging && "shadow-xl border-primary/50 opacity-90"
        )}
      >
        {/* --- ESQUERDA: Drag Handle --- */}
        <button
          {...attributes}
          {...listeners}
          // Mobile: Padding minimo. Desktop: Padding normal.
          className="p-1 sm:p-2 text-muted-foreground/40 hover:text-foreground hover:bg-muted rounded cursor-grab active:cursor-grabbing transition-colors focus-visible:outline-primary flex-shrink-0"
          aria-label="Reordenar item"
        >
          {/* Ícone menor no mobile */}
          <GripVertical className="w-5 h-5 sm:w-5 sm:h-5" />
        </button>

        {/* --- CENTRO: Wrapper de Conteúdo --- */}
        <div className="flex-1 flex flex-row items-start gap-3 sm:gap-4 overflow-hidden group/item">

          {/* Thumbnail Responsiva */}
          <div
            className="relative w-24 sm:w-40 aspect-video flex-shrink-0 rounded-md overflow-hidden cursor-pointer outline-offset-1 focus-visible:outline-primary bg-muted"
            onClick={() => onPlay(item.id)}
          >
            <img
              src={item.thumbnailUrl}
              alt={`Thumbnail de ${item.title}`}
              className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-105"
            />

            {/* Overlay de Play (Apenas Desktop ou telas maiores para não poluir mobile) */}
            <Link
              className="hidden sm:flex absolute inset-0 bg-black/0 transition-all duration-300 group-hover/item:bg-black/30 items-center justify-center"
              to="/v/$eventId"
              params={{ eventId: item.id }}
            >
              <Play
                size={32}
                className="text-white fill-white opacity-0 -translate-y-2 transition-all duration-300 group-hover/item:opacity-100 group-hover/item:translate-y-0 drop-shadow-lg"
              />
            </Link>

            {/* Duração - Texto menor no mobile */}
            <span
              className="absolute bottom-1 right-1 bg-black/80 text-white text-[10px] sm:text-[11px] font-medium px-1 sm:px-1.5 py-0.5 rounded-sm leading-none backdrop-blur-sm">
              {formattedDuration}
            </span>
          </div>

          {/* Texto Responsivo */}
          <div className="flex-1 flex flex-col justify-center min-w-0 h-full py-0.5">
            {/* Título: Menor e com clamp de 2 linhas no mobile */}
            <h3
              className="font-semibold text-sm sm:text-base leading-tight line-clamp-2 sm:line-clamp-1 hover:text-primary transition-colors cursor-pointer"
              onClick={() => onPlay(item.id)}
            >
              {item.title}
            </h3>

            {/* Descrição: Oculta em mobile muito pequeno, visível em desktop */}
            <p className="hidden sm:block text-sm text-muted-foreground line-clamp-2 leading-snug mt-1">
              {item.description}
            </p>

            {/* Metadados: Autor e Data */}
            <div
              className="text-[11px] sm:text-xs text-muted-foreground/70 flex items-center gap-1.5 sm:gap-2 truncate mt-1 sm:mt-auto sm:pt-1">
              <span
                className="font-medium hover:text-foreground transition-colors cursor-pointer truncate max-w-[100px] sm:max-w-none">
                {item.author.name || "Desconhecido"}
              </span>
              <span className="text-muted-foreground/40 hidden sm:inline">•</span>
              <span className="hidden sm:inline">{formattedDate}</span>
            </div>
          </div>
        </div>

        {/* --- DIREITA: Menu --- */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              // Botão menor no mobile (h-8 vs h-9)
              className="h-8 w-8 sm:h-9 sm:w-9 text-muted-foreground hover:text-foreground flex-shrink-0 -mr-1 sm:mr-0"
            >
              <MoreVertical className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onPlay(item.id)}>
              <Play className="mr-2 h-4 w-4" /> Reproduzir agora
            </DropdownMenuItem>
            <DropdownMenuItem>
              <ListVideo className="mr-2 h-4 w-4" /> Adicionar à fila
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onRemove(item.id)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Remover
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </Card>
    </div>
  );
};