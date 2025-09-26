export interface Meta {
    dim?: string;
    url: string;
    duration?: number;
    m?: string;
    fallback?: string;
    size?: number;
}

export type Zap = {
    id: string;
    unknown?: string;
    amount?: number;
};

export interface StructuredTagData {
    d?: string;
    url?: string;
    title?: string;
    alt?: string;
    thumb?: string;
    image?: string;
    t?: string[];
    proxy?: string;
    r?: string[];
    i?: string[];
    zap?: Zap;
    published_at?: number;
    summary?: string;
    fallback?: string;
    imeta?: Meta[];
}

export function extractTag(data: string[][]): StructuredTagData {
    const result: StructuredTagData = {
        t: [],
        r: [],
        i: [],
        imeta: [] ,
    };

    for (const [key, ...values] of data) {
        switch (key) {
            // atributos diretos de string
            case "d":
            case "url":
            case "title":
            case "alt":
            case "thumb":
            case "image":
            case "proxy":
            case "summary":
            case "fallback":
                result[key] = values[0];
                break;

            // arrays
            case "t":
            case "r":
            case "i":
                result[key]!.push(values[0]);
                break;

            // objeto zap
            case "zap":
                result.zap = {
                    id: values[0],
                    unknown: values[1] || undefined,
                    amount: values[2] ? Number(values[2]) : undefined,
                };
                break;

            // número
            case "published_at":
                result.published_at = Number(values[0]);
                break;

            // metadados
            case "imeta": {
                const meta: Meta = {url: ""};
                for (const v of values) {
                    const [k, ...rest] = v.split(" ");
                    const val = rest.join(" ");
                    if (!val) continue;

                    switch (k) {
                        case "dim":
                            meta.dim = val;
                            break;
                        case "url":
                            meta.url = val;
                            break;
                        case "duration":
                            meta.duration = Number(val);
                            break;
                        case "m":
                            meta.m = val;
                            break;
                        case "fallback":
                            meta.fallback = val;
                            break;
                        case "size":
                            meta.size = Number(val);
                            break;
                    }
                }
                result.imeta!.push(meta);
                break;
            }
        }
    }

    return result;
}
