import { NDKEvent, NDKSubscriptionCacheUsage, type NDKUserProfile } from "@nostr-dev-kit/ndk";
import { t } from "i18next";
import { HiCheckBadge } from "react-icons/hi2";
import { lazy, useEffect, useState } from "react";
import { Avatar } from "@radix-ui/themes";

import { RenderText } from "@/components/RenderText.tsx";
import { getNameToShow, getTwoLetters } from "@/helper/format.ts";
import { relativeTime } from "@/helper/date.ts";
import { Link } from "@tanstack/react-router";

type CommentFeedProps = {
  comments: NDKEvent[];
};
// Helper para construir a árvore de comentários
const buildCommentTree = (allComments: NDKEvent[], parentEventId: string | null = null): CommentTreeNode[] => {
  const directComments: NDKEvent[] = [];

  // Primeiro, vamos otimizar encontrando todos os IDs de eventos para evitar buscas repetidas
  const eventIds = new Set(allComments.map(e => e.id));

  for (const comment of allComments) {
    // Encontra a tag 'e' que este comentário está respondendo diretamente.
    // Priorizamos a tag com 'reply' se houver múltiplas tags 'e'.
    const replyToTag = comment.tags.find(
      tag => tag[0] === "e" && tag[3] === "reply"
    );

    if (parentEventId === null) {
      // Este é um comentário de nível superior se ele não tiver uma tag 'e' que seja uma resposta.
      // OU se a tag 'e' que ele responde não existe no nosso conjunto de comentários (indicando que é um root ou a resposta está em outro thread/fora do escopo).
      const isReplyToExistingComment = replyToTag && eventIds.has(replyToTag[1]);

      if (!isReplyToExistingComment) {
        directComments.push(comment);
      }
    } else {
      // Este é uma resposta direta ao parentEventId se a tag 'replyToTag' corresponder.
      if (replyToTag && replyToTag[1] === parentEventId) {
        directComments.push(comment);
      }
    }
  }

  // Ordenar os comentários de nível atual por data de criação (mais antigo primeiro)
  directComments.sort((a, b) => (a.created_at ?? 0) - (b.created_at ?? 0));

  return directComments.map(comment => ({
    comment,
    replies: buildCommentTree(allComments, comment.id) // Recursivamente constrói as respostas para este comentário
  }));
};

export default function CommentFeed({ comments }: CommentFeedProps) {
  if (comments.length === 0) {
    return (
      <div className="center py-2 text-sm text-muted-foreground">
        <p>{t("no_comments_yet")}</p>
      </div>
    );
  }


  // Constrói a árvore de comentários a partir dos comentários de nível superior
  const commentTree = buildCommentTree(comments);


  return (
    <div className="w-full">
      <ul className="space-y-4"> {/* Aumentamos o espaçamento entre os comentários de nível superior */}
        {commentTree.map(({ comment, replies }) => (
          <li key={comment.id}>
            <CommentItem event={comment} replies={replies} depth={0} />
          </li>
        ))}
      </ul>
    </div>
  );
}

const ReactionButtons = lazy(() => import("@/routes/v/@components/Comments/ReactionButtons.tsx"));

// Interface para a estrutura da árvore de comentários
interface CommentTreeNode {
  comment: NDKEvent;
  replies: CommentTreeNode[];
}

type CommentItemProps = {
  event: NDKEvent;
  replies: CommentTreeNode[];
  depth: number; // Indica o nível de indentação
};

export function CommentItem({ event, replies, depth }: CommentItemProps) {
  const npub = event.author.npub;
  const [profile, setProfile] = useState<NDKUserProfile | undefined>();

  useEffect(() => {
    event.author.fetchProfile({ cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST }, true)
      .then((p) => setProfile(p || undefined));
  }, [event.author]);

  // Define classes de indentação baseadas na profundidade
  const indentationClass = depth > 0 ? `ml-2 md:ml-4 lg:ml-6 border-l-2 border-gray-200 pl-4 py-2` : "";

  return (
    <div className={`flex flex-col ${indentationClass}`}>
      <div className="flex w-full gap-x-3 sm:gap-x-4 overflow-hidden items-start">
        {/* Avatar */}
        <Link
          to={`/u/$userId`}
          params={{ userId: npub }}
        >
          <Avatar
            className="flex-shrink-0 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-gray-200 object-cover"
            src={profile?.image}
            alt={profile?.displayName}
            fallback={getTwoLetters({ npub, profile })}
          />
        </Link>

        <div className="flex-1 space-y-1 overflow-hidden">
          {/* Header: Nome e Data */}
          <div className="flex flex-wrap items-center gap-x-2 text-sm">
                        <span className="font-semibold text-gray-800 break-words">
                            {getNameToShow({ npub, profile })}
                        </span>
            {!!profile?.nip05 && (
              <HiCheckBadge className="h-3.5 w-3.5 text-blue-500 shrink-0" />
            )}
            <p className="text-xs text-gray-500">
              {relativeTime(new Date((event.created_at ?? 0) * 1000))}
            </p>
          </div>

          {/* Conteúdo do Comentário */}
          <div className="break-words text-gray-700">
            <RenderText text={event.content} />
          </div>

          {/* Botões de Reação */}
          <ReactionButtons event={event} />
        </div>
      </div>

      {/* Renderiza as respostas recursivamente */}
      {replies.length > 0 && (
        <ul className="mt-2 space-y-2"> {/* Espaçamento entre respostas */}
          {replies.map(({ comment, replies: subReplies }) => (
            <li key={comment.id}>
              <CommentItem event={comment} replies={subReplies} depth={depth + 1} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}