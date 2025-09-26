import type {DetailedHTMLProps, ImgHTMLAttributes} from "react";
import {imageNewSrc} from "@/helper/http.ts";

interface ImageProps extends DetailedHTMLProps<ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement> {
    src: string
    alt: string
    width: string;
}

export function Image({alt, src, width, ...props}: ImageProps) {
    return <img
        src={imageNewSrc(src, width)}
        alt={alt}
        width={width}
        {...props}
    />
}
