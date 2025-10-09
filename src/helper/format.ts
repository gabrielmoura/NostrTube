import {getTagValue, getTagValues} from "@welshman/util";
import clsx, {type ClassValue} from "clsx";
import {twMerge} from "tailwind-merge";
import type {NDKEvent} from "@nostr-dev-kit/ndk-hooks";
import {unixTimeNowInSeconds} from "./date.ts";
import {extractTag} from "@/helper/extractTag.ts";

export const formatPubkey = (pubkey: string | null) => {
    if (!pubkey) return "None";
    return `${pubkey.substring(0, 8)}...${pubkey.substring(pubkey.length - 8)}`;
};


export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatCount(count: number) {
    if (count < 1000) {
        return count;
    } else if (count < 1_000_000) {
        return `${Number((count / 1000).toFixed(1))}K`;
    } else {
        return `${Number((count / 1_000_000).toFixed(1))}M`;
    }
}

export function truncateText(text: string, size?: number) {
    const length = size ?? 5;
    return text.slice(0, length) + "..." + text.slice(-length);
}

export function getNameToShow(user: {
    npub: string;
    profile?: {
        displayName?: string;
        name?: string;
    };
}) {
    return (
        user.profile?.displayName ?? user.profile?.name ?? truncateText(user.npub)
    );
}

export function getLettersPlain(text?: string) {
    if (!text) return "";
    return text
        .split(" ")
        .map((s) => s[0])
        .filter(Boolean)
        .join(" ");
}

export async function downloadVideo(url: string, filename?: string) {
    let name = filename || "video";
    const splitUrl = url.split(".");
    if (splitUrl.length > 1) {
        name += `.${splitUrl.at(-1)}`;
    }
    const video = await fetch(url);
    const videoBlob = await video.blob();
    const videoURL = URL.createObjectURL(videoBlob);
    const link = document.createElement("a");
    link.href = videoURL;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export function btcToSats(amount: number) {
    return parseInt((amount * 100_000_000).toFixed());
}

export function satsToBtc(amount: number) {
    return amount / 100_000_000;
}

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

export async function copyText(text: string) {
    return await navigator.clipboard.writeText(text);
}

export function formatNumber(number: number) {
    if (typeof number === "number") {
        return number.toLocaleString("en-US");
    } else return "not a number";
}

export function getVideoDetails(event: NDKEvent) {
    const url = getTagValues("url", event.tags)[0] ?? "";
    return {
        url: url,
        author: event.author.pubkey,
        publishedAt: parseInt(
            getTagValues("published_at", event.tags)[0] ??
            event.created_at?.toString() ??
            unixTimeNowInSeconds().toString(),
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
            (event.content as string),
    };
}

export function getTwoLetters(user: {
    npub: string;
    profile?: {
        displayName?: string;
        name?: string;
    };
}) {
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

export function getFirstSubdomain(url: string): string | null {
    // Use a regular expression to extract the first subdomain
    const subdomainMatch = url.match(/^(https?:\/\/)?([^.]+)\./i);

    if (subdomainMatch && subdomainMatch[2]) {
        return subdomainMatch[2];
    }

    return null;
}

export function cleanUrl(url?: string) {
    if (!url) return "";
    if (url.slice(-1) === ".") {
        return url.slice(0, -1);
    }
    return url;
}

export function ifHasString(...strings: (string | undefined)[]): string | undefined {
    return strings.find((s) => !!s && s.length > 0);
}

/*
 * Ordena eventos trazendo primenro eventos contendo imagens.
 */
export function sortEventsByImages(a: NDKEvent, b: NDKEvent) {
    const {image: imgA, thumb: thumbA} = extractTag(a.tags);
    const {image: imgB, thumb: thumbB} = extractTag(b.tags);

    const hasImageA = !!ifHasString(thumbA, imgA);
    const hasImageB = !!ifHasString(thumbB, imgB);

    // true vem antes de false
    return (hasImageB ? 1 : 0) - (hasImageA ? 1 : 0);
}