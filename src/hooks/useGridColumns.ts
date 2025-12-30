import { useState, useEffect } from "react";

/**
 * Breakpoints baseados no padrão do Tailwind CSS
 */
const BREAKPOINTS = {
  xl: "(min-width: 1280px)",
  lg: "(min-width: 1024px)",
  md: "(min-width: 768px)",
} as const;

export function useGridColumns() {
  const [columns, setColumns] = useState<number>(1);

  useEffect(() => {
    // Media queries
    const mediaXl = window.matchMedia(BREAKPOINTS.xl);
    const mediaLg = window.matchMedia(BREAKPOINTS.lg);
    const mediaMd = window.matchMedia(BREAKPOINTS.md);

    // Função para calcular as colunas com base nas queries
    const updateColumns = () => {
      if (mediaXl.matches) setColumns(4);
      else if (mediaLg.matches) setColumns(3);
      else if (mediaMd.matches) setColumns(2);
      else setColumns(1);
    };

    // Executa no mount
    updateColumns();

    // Listeners para mudanças (mais eficiente que 'resize')
    mediaXl.addEventListener("change", updateColumns);
    mediaLg.addEventListener("change", updateColumns);
    mediaMd.addEventListener("change", updateColumns);

    return () => {
      mediaXl.removeEventListener("change", updateColumns);
      mediaLg.removeEventListener("change", updateColumns);
      mediaMd.removeEventListener("change", updateColumns);
    };
  }, []);

  return columns;
}