import { type JSX } from "react";

import { cleanUrl, getFirstSubdomain } from "../helper/format";
import { Link } from "@tanstack/react-router";

// regex sources (url split uses this source)
const urlRegexSource =
  "(https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_+.~#?&//=]*))";

// regexes for tests (NO global flag)
const urlTestRegex = new RegExp(urlRegexSource, "i");
const hashtagPattern = /#\b\w+\b/;
const nostrPattern = /nostr:[a-z0-9]+/i;
const imageFileRegex = /\.(png|jpg|jpeg|svg|webp|gif)$/i;
const videoFileRegex = /\.(mp4|mov|wmv|avi)$/i;

// normaliza entrada para string de forma segura
function normalizeText(input: unknown): string {
  if (input == null) return "";
  if (typeof input === "string") return input;
  if (Array.isArray(input)) {
    return input
      .map((it) => (typeof it === "string" ? it : typeof it === "object" ? JSON.stringify(it) : String(it)))
      .join(" ");
  }
  if (typeof input === "object") {
    const obj = input as Record<string, any>;
    // tenta campos comuns
    for (const k of ["text", "content", "body", "message"]) {
      if (typeof obj[k] === "string") return obj[k];
    }
    try {
      return JSON.stringify(input);
    } catch {
      return String(input);
    }
  }
  return String(input);
}

export const RenderText = ({ text }: { text?: unknown }): JSX.Element | null => {
  const safeText = normalizeText(text);
  if (!safeText) return null;

  // combinado para split (mantemos global aqui porque queremos dividir)
  const combinedRegex = new RegExp(`(${urlRegexSource}|${hashtagPattern.source}|${nostrPattern.source})`, "g");
  const parts = safeText.split(combinedRegex).filter(Boolean);

  return (
    <>
      {parts.map((part, idx) => {
        // URL (usa regex SEM g para test confiável)
        if (urlTestRegex.test(part)) {
          const url = cleanUrl(part);
          const subdomain = getFirstSubdomain(part);

          if (imageFileRegex.test(part) || (subdomain && ["i", "image"].includes(subdomain))) {
            return <img key={idx} className="my-1 max-w-xs rounded-md" src={url} alt="" />;
          }

          if (videoFileRegex.test(part)) {
            return <video key={idx} className="my-1 max-w-xs rounded-md" src={url} controls />;
          }

          return (
            <a key={idx} className="text-primary hover:underline break-all" href={url} target="_blank" rel="noreferrer">
              {url}
            </a>
          );
        }

        // hashtag
        if (hashtagPattern.test(part)) {
          return (
            <Link key={idx} to="/search/" params={{ tag: part.substring(1) }}>
              <span className="break-words text-primary hover:underline">{part}</span>
            </Link>
          );
        }

        // nostr
        if (nostrPattern.test(part)) {
          const mention = part.split(":")[1] ?? part;
          if (mention.startsWith("nprofile") || mention.startsWith("npub")) {
            return <span key={idx} className="text-purple-600 font-semibold">Profile: {mention}</span>;
          }
          if (mention.startsWith("nevent") || mention.startsWith("note") || mention.startsWith("naddr")) {
            return <span key={idx} className="text-blue-600 font-semibold">Event: {mention}</span>;
          }
          return <span key={idx}>{part}</span>;
        }

        // texto simples
        return <span key={idx}>{part}</span>;
      })}
    </>
  );
};

export function getUrls(content: unknown): string[] {
  const txt = normalizeText(content);
  const rx = new RegExp(urlRegexSource, "g");
  return txt.match(rx)?.map((u) => cleanUrl(u)) ?? [];
}
