/**
 * Tipagens para as opções de processing do imgproxy.
 * Nota: a serialização para a string de URL precisa mapear booleans para "1"/"t"/"true"
 * e outros valores conforme a doc. Abaixo há uma função `buildProcessingPath`
 * que faz uma serialização básica para as opções mais comuns.
 *
 * Base: https://docs.imgproxy.net/usage/processing :contentReference[oaicite:1]{index=1}
 */

/* --- Helpers / Enums --- */

export type ResizeType = 'fit' | 'fill' | 'fill-down' | 'force' | 'auto';
export type ResizingAlgorithm = 'nearest' | 'linear' | 'cubic' | 'lanczos2' | 'lanczos3';

export type GravityType =
    | 'no' | 'so' | 'ea' | 'we'
    | 'noea' | 'nowe' | 'soea' | 'sowe'
    | 'ce' | 'sm' | 'fp'   // 'fp' (focus point) expects x,y after it
    | `obj` | `objw`      // PRO options (object-oriented gravity)
    ;

/** Position types used for objects_position or gravity position */
export type PositionType =
    | 'no' | 'so' | 'ea' | 'we'
    | 'noea' | 'nowe' | 'soea' | 'sowe' | 'ce'
    | 'prop' | 'fp';

/* Offsets: can be absolute (>=1) or relative (<1) */
export type Offset = number; // caller provides float or int; serializer decides formatting

/* --- Main interface --- */

export interface ImgProxyProcessingOptions {
    // Resize/Size (meta-options)
    resize?: {
        type?: ResizeType;
        width?: number;   // 0 = auto (see doc)
        height?: number;  // 0 = auto
        enlarge?: boolean;
        extend?: boolean | { gravity?: GravityType; x?: Offset; y?: Offset };
    };

    // Shortcut: size (alias to resize without resizing_type)
    size?: {
        width?: number;
        height?: number;
        enlarge?: boolean;
        extend?: boolean | { gravity?: GravityType; x?: Offset; y?: Offset };
    };

    // Individual options (can be used instead of meta)
    width?: number;
    height?: number;
    'min-width'?: number;
    'min-height'?: number;
    zoom?: { x: number; y: number } | number; // number -> uniform zoom
    dpr?: number;
    enlarge?: boolean;
    extend?: boolean | { gravity?: GravityType; x?: Offset; y?: Offset };
    extend_aspect_ratio?: boolean | { gravity?: GravityType; x?: Offset; y?: Offset };

    // Resizing algorithm
    ra?: ResizingAlgorithm;

    // Gravity / cropping
    gravity?: { type: GravityType; x?: Offset; y?: Offset } | {
        special: 'obj' | 'objw';
        classes?: string[];
        weights?: number[]
    } | { special: 'fp'; x: number; y: number };

    // objects_position (used when using obj/object-oriented gravity)
    objects_position?: { type: PositionType } | { type: 'fp'; x: number; y: number } | { type: 'prop' };

    // Crop (crop before resize)
    crop?: { width?: number; height?: number; gravity?: GravityType | { type: 'fp'; x: number; y: number } };

    crop_aspect_ratio?: { aspect_ratio: number; enlarge?: boolean };

    // Trim / remove background
    trim?: { threshold?: number; color?: string; equal_hor?: boolean; equal_ver?: boolean };

    // Any other raw option: supply pre-formatted option strings in order
    raw?: string[]; // ex: ["format:png", "quality:80"] etc.

    // PRO / advanced features (mark optionally)
    _pro?: {
        // object-detection gravity: class names / weights
        objClasses?: string[]; // corresponds to gravity:obj:...
        objWeights?: Array<{ className: string; weight: number }>; // for objw
        // other pro-only options could be added here
    };
}

/* --- Serializer (basic, covers main options) --- */

function boolToArg(v: boolean | undefined) {
    return v ? '1' : '0';
}

function numToArg(n?: number) {
    if (n === undefined || n === null) return undefined;
    return String(n);
}

function offsetToArg(o?: Offset) {
    if (o === undefined || o === null) return undefined;
    return Number.isFinite(o) ? String(o) : undefined;
}

/**
 * Monta a string de processing options na forma de partes separadas por "/".
 * Faz um mapeamento razoável para as opções mais comuns. Não cobre 100% das opções
 * avançadas da doc (objw, weights complexos, etc.), mas serve como ponto de partida.
 */
export function buildProcessingPath(opts: ImgProxyProcessingOptions): string {
    const parts: string[] = [];

    // resize meta-option
    if (opts.resize) {
        const r = opts.resize;
        const args = [
            r.type ?? '',
            numToArg(r.width) ?? '',
            numToArg(r.height) ?? '',
            r.enlarge ? '1' : '',
            // extend can be boolean or object (we stringify boolean here; object ignored for simplicity)
            (typeof r.extend === 'boolean' ? (r.extend ? '1' : '') : (r.extend ? '1' : ''))
        ].filter(Boolean).join(':');
        parts.push(`resize:${args}`);
    } else if (opts.size) {
        const s = opts.size;
        const args = [
            numToArg(s.width) ?? '',
            numToArg(s.height) ?? '',
            s.enlarge ? '1' : '',
            (typeof s.extend === 'boolean' ? (s.extend ? '1' : '') : (s.extend ? '1' : ''))
        ].filter(Boolean).join(':');
        parts.push(`size:${args}`);
    }

    // individual width/height
    if (opts.width !== undefined) parts.push(`width:${opts.width}`);
    if (opts.height !== undefined) parts.push(`height:${opts.height}`);
    if (opts['min-width'] !== undefined) parts.push(`min-width:${opts['min-width']}`);
    if (opts['min-height'] !== undefined) parts.push(`min-height:${opts['min-height']}`);

    // zoom / dpr
    if (opts.zoom !== undefined) {
        if (typeof opts.zoom === 'number') parts.push(`zoom:${opts.zoom}`);
        else parts.push(`zoom:${opts.zoom.x}:${opts.zoom.y}`);
    }
    if (opts.dpr !== undefined) parts.push(`dpr:${opts.dpr}`);

    // enlarge / extend (simple handling)
    if (opts.enlarge !== undefined) parts.push(`enlarge:${opts.enlarge ? '1' : '0'}`);
    if (opts.extend !== undefined) {
        if (typeof opts.extend === 'boolean') parts.push(`extend:${opts.extend ? '1' : '0'}`);
        else parts.push(`extend:1:${opts.extend.gravity ?? 'ce'}`);
    }

    // resizing algorithm
    if ((opts as any).ra) parts.push(`resizing_algorithm:${(opts as any).ra}`);

    // gravity (basic)
    if (opts.gravity) {
        if ('type' in opts.gravity) {
            const g = opts.gravity as any;
            const x = offsetToArg(g.x) ?? '';
            const y = offsetToArg(g.y) ?? '';
            const args = ['gravity', g.type, x, y].filter(Boolean).join(':');
            parts.push(args);
        } else if ('special' in opts.gravity) {
            const g = opts.gravity as any;
            if (g.special === 'obj' && Array.isArray(g.classes) && g.classes.length) {
                parts.push(`gravity:obj:${g.classes.join(':')}`);
            } else if (g.special === 'objw' && Array.isArray(g.weights)) {
                // primitive objw serializer (expects pairs: name:weight...)
                const pairs = g.weights.map((w: any) => `${w.className}:${w.weight}`).join(':');
                parts.push(`gravity:objw:${pairs}`);
            } else if (g.special === 'fp') {
                parts.push(`gravity:fp:${g.x}:${g.y}`);
            }
        }
    }

    // objects_position
    if (opts.objects_position) {
        const op = opts.objects_position as any;
        if (op.type === 'fp') parts.push(`objects_position:fp:${op.x}:${op.y}`);
        else if (op.type === 'prop') parts.push(`objects_position:prop`);
        else parts.push(`objects_position:${op.type}`);
    }

    // crop
    if (opts.crop) {
        const c = opts.crop as any;
        const w = numToArg(c.width) ?? '';
        const h = numToArg(c.height) ?? '';
        const g = typeof c.gravity === 'string' ? c.gravity : undefined;
        const args = ['crop', w, h, g].filter(Boolean).join(':');
        parts.push(args);
    }

    // crop aspect ratio
    if (opts.crop_aspect_ratio) {
        parts.push(`crop_aspect_ratio:${opts.crop_aspect_ratio.aspect_ratio}${opts.crop_aspect_ratio.enlarge ? ':1' : ''}`);
    }

    // trim
    if (opts.trim) {
        const t = opts.trim;
        const args = ['trim', numToArg(t.threshold) ?? '', t.color ?? '', t.equal_hor ? '1' : '', t.equal_ver ? '1' : ''].filter(Boolean).join(':');
        parts.push(args);
    }

    // append raw trailing options if provided
    if (opts.raw && opts.raw.length) {
        parts.push(...opts.raw);
    }

    return parts.join('/');
}

