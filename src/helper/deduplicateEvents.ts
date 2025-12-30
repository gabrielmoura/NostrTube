import type { NDKEvent, NDKKind } from "@nostr-dev-kit/ndk";

/**
 * Remove eventos duplicados de um array, priorizando a versão mais recente.
 * * A chave de unicidade é determinada pela tag 'd' (identificador de eventos substituíveis).
 * Caso a tag 'd' não esteja presente, utiliza o ID do evento como fallback.
 * Se houver múltiplos eventos com a mesma chave, o evento com o maior `created_at` é mantido.
 * * @param events - Array de eventos NDK a serem processados.
 * @returns Um array contendo apenas os eventos únicos e mais recentes.
 */
export function deduplicateEvents(events: NDKEvent[]): NDKEvent[] {
  const uniqueMap = new Map<string, NDKEvent>();

  for (const event of events) {
    // Tenta obter o valor da tag 'd'. Se não existir, usa o ID do evento (fallback).
    const dTagValue = event.tags.find((t) => t[0] === "d")?.[1];
    const key = dTagValue || event.id;

    const existingEvent = uniqueMap.get(key);

    // Lógica de substituição:
    // 1. Se ainda não temos um evento com essa chave no Map, adicionamos.
    // 2. Se já temos, verificamos se o evento atual é mais novo que o armazenado.
    if (
      !existingEvent ||
      (event.created_at || 0) > (existingEvent.created_at || 0)
    ) {
      uniqueMap.set(key, event);
    }
  }

  // Retorna apenas os valores do Map (os eventos únicos mais recentes)
  return Array.from(uniqueMap.values());
}

/**
 * Filtra e deduplica eventos de um Kind específico (NIP-33) dentro de um conjunto.
 * * Esta função separa os eventos que correspondem ao `targetKind` e aplica a lógica de
 * deduplicação neles através da função {@link deduplicateEvents}. Eventos de outros
 * Kinds são preservados sem alterações.
 * * @param events - Um Set ou Array de eventos brutos (mistos ou de tipos variados).
 * @param events
 * @param targetKind - O Kind específico que deve sofrer deduplicação (ex: NDKKind.VideoCurationSet).
 * @returns Um Set contendo os eventos únicos (mais recentes) do Kind alvo somados aos eventos dos demais Kinds.
 */
export function deduplicateParameterizedEvents(
  events: Set<NDKEvent> | NDKEvent[],
  targetKind: NDKKind
): Set<NDKEvent> {
  const eventArray = Array.isArray(events) ? events : Array.from(events);

  // 1. Separa os eventos: os que serão deduplicados e os que passarão direto
  const targetEvents: NDKEvent[] = [];
  const otherEvents: NDKEvent[] = [];

  for (const event of eventArray) {
    if (event.kind === targetKind) {
      targetEvents.push(event);
    } else {
      otherEvents.push(event);
    }
  }

  // 2. Aplica a deduplicação apenas nos eventos do Kind alvo
  const deduplicatedTargets = deduplicateEvents(targetEvents);

  // 3. Retorna a união dos eventos ignorados com os deduplicados
  return new Set([...otherEvents, ...deduplicatedTargets]);
}