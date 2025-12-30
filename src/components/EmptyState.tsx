import { type LucideIcon, Search } from "lucide-react";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode; // Permite botões de "Tentar novamente" ou "Limpar busca"
}

export function EmptyState({
                             icon: Icon = Search,
                             title,
                             description,
                             action
                           }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 px-4 text-center animate-in fade-in zoom-in-95 duration-300">
      {/* Container do Ícone com efeito de opacidade */}
      <div className="relative mb-4">
        <Icon className="w-12 h-12 text-muted-foreground/20" />
      </div>

      {/* Textos */}
      <h3 className="font-semibold text-xl tracking-tight text-foreground">
        {title}
      </h3>

      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-[250px] mx-auto">
          {description}
        </p>
      )}

      {/* Slot para botões/ações extras */}
      {action && (
        <div className="mt-6">
          {action}
        </div>
      )}
    </div>
  );
}