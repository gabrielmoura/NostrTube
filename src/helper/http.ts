import type {ImgProxyProcessingOptions} from "@/helper/imgproxy.ts";
import {buildProcessingPath} from "@/helper/imgproxy.ts";

export function imageNewSrc(src: string, width: number | string): string {
    let newSrc: string
    if (import.meta.env.VITE_APP_IMGPROXY && import.meta.env.VITE_APP_IMGPROXY.length > 5) {
        newSrc = import.meta.env.VITE_APP_IMGPROXY + "/" + width + ",fit/plain/" + src
    } else {
        newSrc = src
    }
    return newSrc
}

interface ImageProxyProps extends ImgProxyProcessingOptions {
    src: string
    imgProxyUrl: string
}

export function imageproxy(opts: ImageProxyProps): string {
    if (!opts.imgProxyUrl) return opts.src
    return opts.imgProxyUrl + "/" + buildProcessingPath(opts) + "/plain/" + opts.src

}