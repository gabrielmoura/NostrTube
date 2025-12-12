import { getTagValue, getTagValues } from "@welshman/util";
import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { unixTimeNowInSeconds } from "./date.ts";
import { extractTag } from "@/helper/extractTag.ts";
import { type NDKEvent, type NDKKind } from "@nostr-dev-kit/ndk";

/**
 * Formata uma chave pública (pubkey) truncando o meio e mantendo os primeiros e últimos 8 caracteres.
 * Útil para exibir identificadores longos de forma abreviada na UI.
 *
 * @param {string | null} pubkey - A chave pública a ser formatada.
 * @returns {string} A string formatada (ex: "a1b2c3d4...w5x6y7z8") ou "None" se a pubkey for nula.
 */
export const formatPubkey = (pubkey: string | null) => {
  if (!pubkey) return "None";
  return `${pubkey.substring(0, 8)}...${pubkey.substring(pubkey.length - 8)}`;
};

/**
 * Utilitário para combinar nomes de classes CSS condicionalmente e resolver conflitos do Tailwind.
 * Combina `clsx` (para condicionais) e `twMerge` (para conflitos de estilo).
 *
 * @param {...ClassValue[]} inputs - Lista de classes, objetos ou arrays de classes.
 * @returns {string} Uma string única com as classes processadas e mescladas.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Formata números grandes para uma representação abreviada (K, M).
 * Ex: 1500 -> 1.5K, 2000000 -> 2.0M.
 *
 * @param {number} count - O número a ser formatado.
 * @returns {string | number} O número original (se < 1000) ou a string formatada.
 */
export function formatCount(count: number): string | number {
  if (count < 1000) {
    return count;
  } else if (count < 1_000_000) {
    return `${Number((count / 1000).toFixed(1))}K`;
  } else {
    return `${Number((count / 1_000_000).toFixed(1))}M`;
  }
}

/**
 * Trunca um texto mantendo o início e o fim, inserindo "..." no meio.
 * Diferente do truncate comum que corta apenas o final.
 *
 * @param {string} text - O texto a ser truncado.
 * @param {number} [size=5] - O número de caracteres a manter em cada extremidade (padrão: 5).
 * @returns {string} O texto truncado (ex: "abcde...vwxyz").
 */
export function truncateText(text: string, size?: number): string {
  const length = size ?? 5;
  return text.slice(0, length) + "..." + text.slice(-length);
}

/**
 * Determina o melhor nome para exibir de um usuário baseando-se na hierarquia:
 * Display Name > Name > Npub truncado.
 *
 * @param {Object} user - Objeto do usuário contendo npub e perfil opcional.
 * @returns {string} O nome escolhido para exibição.
 */
export function getNameToShow(user: {
  npub: string;
  profile?: {
    displayName?: string;
    name?: string;
  };
}): string {
  return (
    user.profile?.displayName ?? user.profile?.name ?? truncateText(user.npub)
  );
}

/**
 * Extrai a primeira letra de cada palavra em uma string, separadas por espaço.
 *
 * @param {string} [text] - O texto de entrada.
 * @returns {string} Uma string contendo apenas as iniciais (ex: "Hello World" -> "H W").
 */
export function getLettersPlain(text?: string): string {
  if (!text) return "";
  return text
    .split(" ")
    .map((s) => s[0])
    .filter(Boolean)
    .join(" ");
}

/**
 * Converte um valor de Bitcoin (BTC) para Satoshis (Sats).
 *
 * @param {number} amount - Valor em BTC.
 * @returns {number} Valor inteiro em Satoshis.
 */
export function btcToSats(amount: number) {
  return parseInt((amount * 100_000_000).toFixed());
}

/**
 * Converte um valor de Satoshis (Sats) para Bitcoin (BTC).
 *
 * @param {number} amount - Valor em Satoshis.
 * @returns {number} Valor em BTC.
 */
export function satsToBtc(amount: number) {
  return amount / 100_000_000;
}

/**
 * Remove itens duplicados de um array.
 * Pode operar em arrays de primitivos ou arrays de objetos (usando uma chave específica).
 *
 * @template T
 * @param {T[]} data - Array original com possíveis duplicatas.
 * @param {keyof T} [key] - (Opcional) Chave do objeto para verificar unicidade.
 * @returns {T[]} Novo array sem duplicatas.
 */
export function removeDuplicates<T>(data: T[], key?: keyof T) {
  if (key) {
    return data.filter((obj, index) => {
      return index === data.findIndex((o) => obj[key] === o[key]);
    });
  } else {
    return data.filter((obj, index) => {
      return index === data.findIndex((o) => obj === o);
    });
  }
}

/**
 * Copia o texto fornecido para a área de transferência do sistema.
 *
 * @param {string} text - O texto a ser copiado.
 * @returns {Promise<void>} Promise que resolve quando a cópia é concluída.
 */
export async function copyText(text: string): Promise<void> {
  return await navigator.clipboard.writeText(text);
}

/**
 * Formata um número de acordo com o locale 'en-US' (com separadores de milhar).
 * Retorna uma string de erro se a entrada não for um número.
 *
 * @param {number} number - O número a formatar.
 * @returns {string} Número formatado (ex: "1,234") ou "not a number".
 */
export function formatNumber(number: number): string {
  if (typeof number === "number") {
    return number.toLocaleString("en-US");
  } else return "not a number";
}

/**
 * Extrai detalhes estruturados de um evento NDK, focando em metadados de vídeo.
 * Tenta inferir thumbnail de URLs do YouTube se a tag de imagem estiver ausente.
 *
 * @param {NDKEvent} event - O evento Nostr a ser processado.
 * @returns {Object} Objeto contendo url, autor, data de publicação, thumbnail, título e resumo.
 */
export function getVideoDetails(event: NDKEvent): object {
  const url = getTagValues("url", event.tags)[0] ?? "";
  return {
    url: url,
    author: event.author.pubkey,
    publishedAt: parseInt(
      getTagValues("published_at", event.tags)[0] ??
      event.created_at?.toString() ??
      unixTimeNowInSeconds().toString()
    ),
    thumbnail:
      getTagValues("thumb", event.tags) ??
      getTagValues("thumbnail", event.tags) ??
      getTagValues("image", event.tags) ??
      (url.includes("youtu")
        ? `http://i3.ytimg.com/vi/${
          url.includes("/youtu.be/")
            ? url.split("youtu.be/").pop()
            : url.split("?v=").pop()
        }/hqdefault.jpg`
        : ""),
    title: getTagValue("title", event.tags) ?? "Untitled",
    summary:
      getTagValues("summary", event.tags) ??
      getTagValues("about", event.tags) ??
      (event.content as string)
  };
}

/**
 * Gera uma string de duas letras para ser usada como avatar/fallback.
 * Tenta usar as iniciais do Display Name, depois Name, e por fim caracteres do NPUB.
 *
 * @param {Object} user - Objeto do usuário.
 * @returns {string} String de 2 caracteres.
 */
export function getTwoLetters(user: {
  npub: string;
  profile?: {
    displayName?: string;
    name?: string;
  };
}): string {
  if (user.profile) {
    if (user.profile.displayName) {
      const firstLetter = user.profile.displayName.at(0);
      const secondLetter =
        user.profile.displayName.split(" ")[1]?.at(0) ??
        user.profile.displayName.at(1) ??
        "";
      return firstLetter + secondLetter;
    }
    if (user.profile.name) {
      const firstLetter = user.profile.name.at(0);
      const secondLetter =
        user.profile.name.split(" ")[1]?.at(0) ?? user.profile.name.at(1) ?? "";
      return firstLetter + secondLetter;
    }
  }
  return (user.npub.at(5) ?? "") + (user.npub.at(6) ?? "");
}

/**
 * Extrai o primeiro subdomínio de uma URL usando Regex.
 *
 * @param {string} url - A URL completa.
 * @returns {string | null} O subdomínio encontrado ou null.
 */
export function getFirstSubdomain(url: string): string | null {
  // Use a regular expression to extract the first subdomain
  const subdomainMatch = url.match(/^(https?:\/\/)?([^.]+)\./i);

  if (subdomainMatch && subdomainMatch[2]) {
    return subdomainMatch[2];
  }

  return null;
}

/**
 * Limpa uma URL removendo o ponto final se existir.
 *
 * @param {string} [url] - A URL a ser limpa.
 * @returns {string} URL sanitizada ou string vazia.
 */
export function cleanUrl(url?: string): string {
  if (!url) return "";
  if (url.slice(-1) === ".") {
    return url.slice(0, -1);
  }
  return url;
}

/**
 * Retorna a primeira string não vazia e definida dentre os argumentos passados.
 *
 * @param {...(string | undefined)[]} strings - Lista de strings ou undefined.
 * @returns {string | undefined} A primeira string válida encontrada.
 */
export function ifHasString(...strings: (string | undefined)[]): string | undefined {
  return strings.find((s) => !!s && s.length > 0);
}

/**
 * Função de comparação para ordenar eventos, priorizando aqueles que possuem imagens ou thumbnails.
 * Útil para `Array.sort()`.
 *
 * @param {NDKEvent} a - Primeiro evento.
 * @param {NDKEvent} b - Segundo evento.
 * @returns {number} Retorna positivo se B tem imagem e A não, negativo se o contrário, ou 0.
 */
export function sortEventsByImages(a: NDKEvent, b: NDKEvent): number {
  const { image: imgA, thumb: thumbA } = extractTag(a.tags);
  const { image: imgB, thumb: thumbB } = extractTag(b.tags);

  const hasImageA = !!ifHasString(thumbA, imgA);
  const hasImageB = !!ifHasString(thumbB, imgB);

  // true vem antes de false
  return (hasImageB ? 1 : 0) - (hasImageA ? 1 : 0);
}

/**
 * Filtra eventos parametrizados (NIP-33), mantendo apenas a versão mais recente
 * baseada na tag 'd' para um Kind específico.
 * * @param events Conjunto ou Array de eventos brutos
 * @param events
 * @param targetKind O Kind que deve ser deduplicado (ex: NDKKind.VideoCurationSet)
 * @returns Um Set contendo os eventos únicos (mais recentes) + eventos de outros kinds
 */
export function deduplicateParameterizedEvents(
  events: Set<NDKEvent> | NDKEvent[],
  targetKind: NDKKind
): Set<NDKEvent> {
  const processedEvents = new Set<NDKEvent>();
  const dedupMap = new Map<string, NDKEvent>();

  for (const event of events) {
    // Se não for o kind alvo, passa direto
    if (event.kind !== targetKind) {
      processedEvents.add(event);
      continue;
    }

    // Lógica de Deduplicação (NIP-33)
    const dTag = event.tagId(); // Retorna o valor da tag "d"
    const existing = dedupMap.get(dTag);

    // Se é o primeiro que vemos OU é mais novo que o guardado, atualizamos
    if (!existing || (event.created_at || 0) > (existing.created_at || 0)) {
      dedupMap.set(dTag, event);
    }
  }

  // Adiciona os vencedores da deduplicação ao set final
  dedupMap.forEach((evt) => processedEvents.add(evt));

  return processedEvents;
}