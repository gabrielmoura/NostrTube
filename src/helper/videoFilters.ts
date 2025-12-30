import { NDKEvent } from "@nostr-dev-kit/ndk";
import { getTagValue } from "@welshman/util";
import { deduplicateEvents } from "@/helper/deduplicateEvents.ts";
import { NostrKind } from "@/helper/type.ts";

/**
 * Recebe uma lista de eventos (vídeos e métricas de popularidade),
 * deduplica os vídeos e os ordena com base nas views encontradas nos eventos Kind 34237.
 * @param {NDKEvent[]} events - Lista mista de eventos de vídeo e métricas.
 * @returns {NDKEvent[]} Lista de vídeos deduplicados e ordenados por popularidade.
 */
export function processPopularVideos(events: NDKEvent[]): NDKEvent[] {
  // 1. Separar eventos de métricas (Kind 34237) dos eventos de vídeo
  const metricsEvents = events.filter(e => e.kind === NostrKind.VideoViewer);
  const videoEvents = events.filter(e => e.kind !== NostrKind.VideoViewer);

  // 2. Criar um mapa de visualizações (ID do vídeo -> quantidade de views)
  const viewMap = new Map<string, number>();

  metricsEvents.forEach(metric => {
    const videoId = getTagValue("d", metric.tags);
    if (!videoId) return;

    const viewCountStr = getTagValue("viewed", metric.tags) || "0";
    const views = parseInt(viewCountStr, 10);

    // Se houver mais de um evento de métrica para o mesmo vídeo, ficamos com o maior valor
    const currentMax = viewMap.get(videoId) || 0;
    viewMap.set(videoId, Math.max(currentMax, isNaN(views) ? 0 : views));
  });

  // 3. Deduplicar os vídeos usando a lógica que você forneceu
  const uniqueVideos = deduplicateEvents(videoEvents);

  // 4. Ordenar os vídeos deduplicados pelo mapa de views
  return uniqueVideos.sort((a, b) => {
    const idA = getTagValue("d", a.tags) || a.id;
    const idB = getTagValue("d", b.tags) || b.id;

    const viewsA = viewMap.get(idA) || 0;
    const viewsB = viewMap.get(idB) || 0;

    // Se as views forem iguais, ordena pelo mais recente (created_at)
    if (viewsB === viewsA) {
      return (b.created_at || 0) - (a.created_at || 0);
    }

    return viewsB - viewsA;
  });
}