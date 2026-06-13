import type { NDKEvent } from "@nostr-dev-kit/ndk-hooks";
import { Link } from '@tanstack/react-router'
import { Compass, MessageCircle, ShieldCheck, Sparkles } from 'lucide-react'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import type { VideoAssetSet } from "@/features/video/services/video-imeta.service";
import { ErrorBoundaryVideo } from "@/routes/v/@components/error";
import { VideoPlayerContainer } from "@/routes/v/@components/VideoPlayerContainer";
import { VideoActionsContainer } from "@/features/video/components/VideoActionsContainer";
import { VideoCommentsContainer } from "@/features/video/components/VideoCommentsContainer";

interface VideoPageViewProps {
  event: NDKEvent;
  title: string;
  image?: string;
  fallbackUrl?: string;
  eventIdentifier: string;
  assetSet: VideoAssetSet;
  onCanPlay: () => Promise<void> | void;
}

export function VideoPageView({
  event,
  title,
  image,
  fallbackUrl,
  eventIdentifier,
  assetSet,
  onCanPlay
}: VideoPageViewProps) {
  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-4 sm:py-4">
      <div className="rounded-3xl border border-border/70 bg-gradient-to-br from-card/90 via-card/70 to-primary/5 px-5 py-5 shadow-sm sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-primary/80">Relay Cinema Playback</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
              <Sparkles className="size-4 text-primary" />
              Assista, interaja, salve para depois e continue descobrindo conteúdo soberano.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/search" className={buttonVariants({ variant: 'glass' })}>
              <Compass className="mr-2 size-4" />
              Continuar explorando
            </Link>
            <Link to="/terms" className={buttonVariants({ variant: 'glass' })}>
              <ShieldCheck className="mr-2 size-4" />
              Regras da rede
            </Link>
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="shrink-1 flex-1 md:min-w-[500px]">
          <div className="sticky top-[calc(var(--header-height))] z-30 aspect-video w-full overflow-hidden sm:static sm:max-h-[calc(61vw-32px)] sm:rounded-xl sm:px-4">
            <ErrorBoundaryVideo>
              <VideoPlayerContainer
                title={title}
                image={image}
                fallbackUrl={fallbackUrl}
                assetSet={assetSet}
                onCanPlay={onCanPlay}
                className="overflow-hidden sm:rounded-xl"
              />
            </ErrorBoundaryVideo>
          </div>
          <div className="px-4">
            <div className="pt-1">
              <ErrorBoundaryVideo>
                <VideoActionsContainer event={event} />
              </ErrorBoundaryVideo>
            </div>
            <ErrorBoundaryVideo>
              <VideoCommentsContainer
                eventReference={eventIdentifier}
                eventId={event.id}
                pubkey={event.pubkey}
              />
            </ErrorBoundaryVideo>
          </div>
        </div>
        <aside className="lg:w-[300px] lg:shrink-0">
          <Card className="border-border/60 bg-card/75">
            <CardContent className="space-y-3 p-5 text-sm text-muted-foreground">
              <div className="flex items-center gap-2 text-foreground">
                <MessageCircle className="size-4 text-primary" />
                <p className="font-medium">Participe da conversa</p>
              </div>
              <p>
                Use os comentários para reagir ao vídeo, deixar contexto para outros espectadores e continuar a thread no ecossistema Nostr.
              </p>
              <div className="rounded-2xl border border-border/60 bg-muted/20 px-3 py-2 text-xs">
                Dica: highlights e status ao vivo podem enriquecer essa experiência em uma próxima iteração.
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
