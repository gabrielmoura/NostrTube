import type {DetailedHTMLProps, ImgHTMLAttributes} from "react";
import {getOptimizedImageSrc} from "@/helper/http.ts";

interface ImageProps extends DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
    src: string
    alt: string
    width: string|number;
}

export function Image({alt, src, width, ...props}: ImageProps) {
    return <img
        src={getOptimizedImageSrc(src, width)}
        alt={alt}
        width={width}
        {...props}
    />
}
