import {useCallback} from "react";
import NDK, {NDKEvent, NDKKind, NDKSubscriptionCacheUsage} from "@nostr-dev-kit/ndk";
import {getTagValue, getTagValues} from "@welshman/util";
import {makeEvent} from "@/helper/pow/pow.ts";
import {nostrNow} from "@/helper/date.ts";
import {NostrKind} from "@/helper/type.ts";

/**
 * Interface para os parâmetros da função `markView`.
 * Estes são os dados que o componente passará ao chamar `markView`.
 */
interface MarkViewParams {
    pubKey: string; // Usuário atual que está visualizando o evento (Npub é um tipo string)
    eventIdentifier: string; // Identificador único do evento (ex: o 'a' tag)
    ndk: NDK; // Instância do NDK para interação com a rede Nostr
}

/**
 * Interface para os parâmetros da função `countView`.
 */
interface CountViewParams {
    eventIdentifier: string; // Identificador único do evento (ex: o 'a' tag)
    ndk: NDK; // Instância do NDK para interação com a rede Nostr
}

interface useRecordView {
    markView: (params: MarkViewParams) => Promise<NDKEvent | undefined>,
    countView: (params: CountViewParams) => Promise<{
        totalViews: number;
        events: NDKEvent[];
    }>
}

/**
 * Um hook React para registrar ou atualizar um evento de visualização para um item de vídeo Nostr,
 * e para contar o total de visualizações.
 *
 * @returns {{
 *   markView: (params: MarkViewParams) => Promise<NDKEvent | undefined>,
 *   countView: (params: CountViewParams) => { events: Set<NDKEvent>, totalViews: number, isLoading: boolean }
 * }}
 *          Um objeto contendo a função `markView` e a função `countView`.
 */
export function useRecordView(): useRecordView {
    /**
     * `markView` é a função principal para registrar uma visualização.
     * Ela é memorizada com `useCallback` para otimização, garantindo que sua referência
     * não mude entre re-renderizações do componente que usa este hook.
     *
     * @param {MarkViewParams} params Os parâmetros necessários para registrar a visualização.
     * @returns {Promise<NDKEvent | undefined>} Uma Promise que resolve para o NDKEvent de visualização
     *                                        atualizado e publicado, ou `undefined` em caso de erro.
     */
    const markView = useCallback(async ({
                                            pubKey,
                                            eventIdentifier,
                                            ndk,
                                        }: MarkViewParams): Promise<NDKEvent | undefined> => {
        // 1. Validação inicial dos parâmetros
        if (!ndk || !pubKey || !eventIdentifier) {
            console.warn("markView: Parâmetros ndk, pubKey ou eventIdentifier são obrigatórios.");
            return undefined;
        }

        try {
            // 2. Tenta buscar um evento de visualização existente para este usuário e identificador
            const existingViewEvent: NDKEvent | null = await ndk.fetchEvent({
                authors: [pubKey],
                kinds: [NostrKind.VideoViewer as NDKKind],
                "#a": [eventIdentifier],
            });

            let currentViewCount = 0; // Inicializa a contagem de visualizações

            // 3. Verifica se um evento de visualização foi encontrado e extrai a contagem
            if (existingViewEvent) {
                const viewedTagValue = getTagValue("viewed", existingViewEvent.tags);
                if (typeof viewedTagValue === "string") {
                    const parsedCount = parseInt(viewedTagValue, 10);
                    if (!isNaN(parsedCount)) {
                        currentViewCount = parsedCount;
                    }
                }
            }

            // 4. Incrementa a contagem de visualizações
            const newViewCount = currentViewCount + 1;

            // 5. Prepara as tags para o novo evento ou atualização
            const tags = [
                ["a", eventIdentifier],
                ["d", eventIdentifier], // Usar 'd' como um identificador para deletar ou substituir eventos anteriores
                ["viewed", newViewCount.toString()],
            ];

            // 6. Cria (ou prepara) o evento de visualização com a nova contagem
            const updatedViewEvent: NDKEvent = await makeEvent({
                ndk,
                event: {
                    content: "",
                    kind: NostrKind.VideoViewer as NDKKind,
                    tags: tags,
                    created_at: nostrNow(),
                    pubkey: pubKey,
                },
            });

            // 7. Publica o evento na rede Nostr
            await updatedViewEvent.publish();

            // 8. Retorna o evento de visualização publicado
            return updatedViewEvent;

        } catch (err) {
            // 9. Captura e loga quaisquer erros que ocorram durante o processo
            console.error("Erro ao registrar visualização:", err);
            return undefined; // Retorna undefined para indicar que a operação falhou
        }
    }, []); // As dependências estão vazias porque ndk, pubKey, eventIdentifier são passados
    // como parâmetros na chamada de markView, e não são do escopo direto do hook.

    /**
     * `countView` é uma função que usa o hook `useSubscribe` para obter todos os eventos
     * de visualização para um `eventIdentifier` e calcula a soma das contagens de visualização.
     *
     * @param {CountViewParams} params Os parâmetros necessários para contar as visualizações.
     * @returns {{ events: Set<NDKEvent>, totalViews: number, isLoading: boolean }}
     *          Um objeto contendo o conjunto de eventos de visualização, a contagem total de visualizações
     *          e um status de carregamento.
     */
    const countView = useCallback(async ({eventIdentifier, ndk}: CountViewParams): Promise<{
        totalViews: number;
        events: NDKEvent[];
    }> => {
        if (!ndk || !eventIdentifier) {
            console.warn("countView: Parâmetros ndk ou eventIdentifier são obrigatórios.");
            return {events: [], totalViews: 0};
        }


        const events: Set<NDKEvent> = await ndk.fetchEvents(
            [{
                kinds: [NostrKind.VideoViewer as NDKKind],
                "#a": [eventIdentifier],
            }], {
                // Usar CACHE_FIRST para obter resultados rapidamente, e CACHE_THEN_RELAY para atualizar
                // se houver novos eventos nos relays.
                cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST,
                closeOnEose: false, // Manter a subscrição aberta para atualizações em tempo real
                // A subscrição será fechada quando o componente que usa este hook for desmontado.
            })

        const evtArray = Array.from(events)

        const totalViews = evtArray.reduce((acc, curr) => {
            const val = getTagValues("viewed", curr.tags)[0];
            const parsed = parseInt(val, 10);
            return acc + (isNaN(parsed) ? 0 : parsed);
        }, 0);

        return {
            events: evtArray as NDKEvent[],
            totalViews,
        };
    }, []); // As dependências estão vazias porque ndk, eventIdentifier são passados
    // como parâmetros na chamada de countView, e não são do escopo direto do hook.

    return {markView, countView};
}