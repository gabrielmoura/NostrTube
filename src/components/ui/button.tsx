import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Mantive suas classes originais, o 'gap-2' aqui é crucial para o espaço entre o spinner e o texto
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

// Spinner SVG inline para não depender de bibliotecas externas (ex: Lucide)
const LoadingSpinner = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("animate-spin", className)}
    aria-hidden="true"
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export interface ButtonProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
}

function Button({
                  className,
                  variant,
                  size,
                  asChild = false,
                  isLoading = false,
                  children,
                  disabled,
                  ...props
                }: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  // UX: Se estiver carregando, o botão deve estar desabilitado
  const isDisabled = disabled || isLoading;

  return (
    <Comp
      data-slot="button"
      disabled={isDisabled}
      aria-busy={isLoading} // UX: Indica para screen readers que algo está ocorrendo
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {/* Lógica de Renderização:
         Se estiver carregando, mostramos o spinner.
         Se 'asChild' for true (Slot), evitamos injetar o SVG diretamente
         pois o Slot espera um único filho, o que quebraria a lógica se não tratado com cuidado.
         Nesse caso, assume-se que o componente filho lida com o conteúdo.
      */}
      {isLoading && !asChild && <LoadingSpinner />}

      {children}
    </Comp>
  );
}

export { Button, buttonVariants };