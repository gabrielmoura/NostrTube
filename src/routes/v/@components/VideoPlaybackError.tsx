interface VideoPlaybackErrorProps {
  message: string
}

export function VideoPlaybackError({ message }: VideoPlaybackErrorProps) {
  return (
    <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
      {message}
    </div>
  )
}
