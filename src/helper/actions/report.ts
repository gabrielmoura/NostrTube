import { makeEvent } from "@/helper/pow/pow.ts";
import { nostrNow } from "@/helper/date.ts";
import NDK__default, { type NDKEvent, NDKKind } from "@nostr-dev-kit/ndk";
import { sendTechnicalIssueMessage } from "@/lib/ndk-messages";

export const TECHNICAL_REPORT_KIND = 17242;

export interface ContentReportActionProps {
  id: string;
  description?: string;
  category: string;
  pubkey: string;
  ndk: NDK__default;
}

export interface TechnicalReportActionProps {
  id: string;
  description?: string;
  category: string;
  pubkey: string;
  authorPubkey: string;
  relayUrls?: string[];
  ndk: NDK__default;
}

export async function reportContentAction({
  id,
  description,
  ndk,
  pubkey,
  category
}: ContentReportActionProps): Promise<NDKEvent> {
  const reportEvent = await makeEvent({
    difficulty: Number(import.meta.env.VITE_MIN_COMMENT_POW ?? 10),
    event: {
      created_at: nostrNow(),
      kind: NDKKind.Report,
      content: description || "",
      tags: [
        ["alt", `Content report for ${category}`],
        ["e", id, category],
        ["L", "content-report"],
        ["l", category, "content-report"]
      ],
      pubkey
    },
    ndk
  });
  await reportEvent.publish();
  return reportEvent;
}

export async function reportTechnicalAction({
  id,
  description,
  ndk,
  pubkey,
  category,
  authorPubkey,
  relayUrls = []
}: TechnicalReportActionProps): Promise<NDKEvent> {
  const messageLines = [
    `Problema técnico reportado para o vídeo ${id}`,
    `Categoria: ${category}`,
    description ? `Detalhes: ${description}` : "",
    relayUrls.length ? `Relays: ${relayUrls.join(", ")}` : ""
  ].filter(Boolean);

  await sendTechnicalIssueMessage(ndk, authorPubkey, messageLines.join("\n"));

  const reportEvent = await makeEvent({
    difficulty: Number(import.meta.env.VITE_MIN_COMMENT_POW ?? 10),
    event: {
      created_at: nostrNow(),
      kind: TECHNICAL_REPORT_KIND,
      content: description || "",
      tags: [
        ["alt", `Technical report for ${category}`],
        ["e", id],
        ["p", authorPubkey],
        ["k", "technical-report"],
        ["type", category],
        ...relayUrls.map((relayUrl) => ["relay", relayUrl])
      ],
      pubkey
    },
    ndk
  });
  await reportEvent.publish();
  return reportEvent;
}
