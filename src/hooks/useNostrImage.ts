import { useState, useMemo } from "react";
import { NDKEvent, mapImetaTag } from "@nostr-dev-kit/ndk";
import { getTags } from "@welshman/util";
import { extractTag } from "@/helper/extractTag.ts";
import { ifHasString } from "@/helper/format.ts";
import { getOptimizedImageSrc } from "@/helper/http.ts";

/**
 * Hook customizado para processamento e gestão de mídia em eventos Nostr.
 * * Este hook centraliza a lógica de extração de metadados, resolução de hierarquia
 * de URLs (thumbnail > imeta > url) e controle de estado de carregamento de imagem.
 * * @param {NDKEvent} event - O evento Nostr contendo as tags de mídia (Kind 1, 20, 30063, etc).
 * * @returns {Object} Objeto contendo estados de carregamento e dados da imagem.
 * @returns {string | null} optimized - URL da imagem processada e otimizada para o componente.
 * @returns {string | undefined} title - Título ou descrição extraída das tags para uso em `alt`.
 * @returns {boolean} isNSFW - Indica se o evento possui tags de conteúdo sensível (`content-warning` ou `nsfw`).
 * @returns {boolean} loading - Estado de carregamento da imagem (gerenciado via handlers).
 * @returns {boolean} error - Indica se houve falha ao carregar a URL final da imagem.
 * @returns {Object} handlers - Callbacks para serem injetados diretamente no elemento `<img>`.
 * @returns {Function} handlers.onLoad - Handler para definir `loading` como falso.
 * @returns {Function} handlers.onError - Handler para tratar falhas e definir `error` como verdadeiro.
 * * @example
 * const { optimized, handlers, loading } = useNostrImage(event);
 * * return (
 * <div className={loading ? 'animate-pulse' : ''}>
 * {optimized && <img src={optimized} onLoad={handlers.onLoad} onError={handlers.onError} />}
 * </div>
 * );
 */
export function useNostrImage(event: NDKEvent) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  const imageSpecs = useMemo(() => {
    const { image, thumb, title, url: directUrl } = extractTag(event.tags);

    // Resolução de URL seguindo a hierarquia de prioridade
    let finalUrl = directUrl;
    if (!finalUrl) {
      const imeta = getTags("imeta", event.tags)
        .map(tag => mapImetaTag(tag))
        .find(i => i.url);
      finalUrl = imeta?.url;
    }

    const source = ifHasString(thumb, image) || finalUrl;

    // Otimização
    const optimized = source
      ? getOptimizedImageSrc(source, "480", {
        resize: { resizing_type: "fit", width: 480, height: 480 },
        format: "webp"
      })
      : null;

    const isNSFW = event.tags.some(t => t[0] === "content-warning" || t[0] === "nsfw");

    return { optimized, title, isNSFW };
  }, [event]);

  return {
    ...imageSpecs,
    loading,
    error,
    handlers: {
      onLoad: () => setLoading(false),
      onError: () => { setLoading(false); setError(true); }
    }
  };
}