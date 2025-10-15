/**
 * Detecta e retorna o idioma principal do navegador do usuário.
 * * @returns A string do código do idioma (ex: "pt-BR", "en-US").
 */
export function detectLanguageMain(): string | undefined {
    if (navigator.languages && navigator.languages.length) {
        return navigator.languages[0];
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return navigator.language || (navigator as any).userLanguage || undefined;
}
//   ["L", "ISO-3166-2"],
//     ["l", "IT-MI", "ISO-3166-2"]