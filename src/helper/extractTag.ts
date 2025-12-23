// 1. Definição de Tipos Refinada
export interface Meta {
  url: string;
  dim?: string;
  duration?: number;
  m?: string;
  fallback?: string;
  size?: number;
}

export type Zap = {
  id: string;
  relays?: string; // Renomeado de 'unknown' para algo mais semântico, se aplicável (geralmente é relay)
  amount?: number;
};

export interface StructuredTagData {
  // Propriedades Simples
  d?: string;
  url?: string;
  title?: string;
  alt?: string;
  thumb?: string;
  image?: string;
  proxy?: string;
  summary?: string;
  fallback?: string;
  duration?: number; // Mudado de 'any' para 'number'
  published_at?: number;

  // Arrays e Objetos Complexos
  t: string[];
  r: string[];
  i: string[];
  imeta: Meta[];
  zap?: Zap;
}

// Lista de chaves que são apenas strings simples (1:1)
const SIMPLE_STRING_KEYS = new Set([
  "d", "url", "title", "alt", "thumb",
  "image", "proxy", "summary", "fallback"
]);

// 2. Helper para parsear os atributos do imeta
function parseMetaAttributes(attributes: string[]): Meta {
  const meta: Meta = { url: "" };

  for (const attr of attributes) {
    // Divide apenas no primeiro espaço para preservar espaços no valor
    const separatorIndex = attr.indexOf(" ");
    if (separatorIndex === -1) continue;

    const key = attr.slice(0, separatorIndex);
    const val = attr.slice(separatorIndex + 1);

    if (!val) continue;

    switch (key) {
      case "url":
        meta.url = val;
        break;
      case "dim":
        meta.dim = val;
        break;
      case "m":
        meta.m = val;
        break;
      case "fallback":
        meta.fallback = val;
        break;
      case "duration":
        meta.duration = Number(val);
        break;
      case "size":
        meta.size = Number(val);
        break;
    }
  }
  return meta;
}

// 3. Função Principal
export function extractTag(data: string[][]): StructuredTagData {
  // Inicialização limpa
  const result: StructuredTagData = {
    t: [],
    r: [],
    i: [],
    imeta: []
  };

  for (const [key, ...values] of data) {
    if (!key) continue;

    // Caso 1: Atributos de String Simples
    if (SIMPLE_STRING_KEYS.has(key)) {
      // TypeScript precisa dessa asserção pois acessamos dinamicamente
      (result as any)[key] = values[0];
      continue;
    }

    // Caso 2: Lógica Específica
    switch (key) {
      // Arrays
      case "t":
      case "r":
      case "i":
        if (values[0]) result[key].push(values[0]);
        break;

      // Objeto Zap
      case "zap":
        result.zap = {
          id: values[0],
          relays: values[1] || undefined,
          amount: values[2] ? Number(values[2]) : undefined
        };
        break;

      // Números
      case "published_at":
        result.published_at = Number(values[0]);
        break;

      // Duração (no root)
      case "duration":
        result.duration = Number(values[0]);
        break;

      // Metadados Complexos
      case "imeta":
        const metaObj = parseMetaAttributes(values);
        // Só adiciona se tiver pelo menos a URL (ou conforme sua regra de negócio)
        if (metaObj.url) {
          result.imeta.push(metaObj);
        }
        break;
    }
  }

  return result;
}