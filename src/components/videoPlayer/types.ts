type ChaptersTrack = {
  src: string;
  kind: "chapters";
  language: string;
  default?: boolean;
};
type SubtitlesTrack = {
  src: string;
  kind: "subtitles";
  language: string;
  label: string;
  default?: boolean;
};

type TrackType = ChaptersTrack | SubtitlesTrack;

export type { TrackType };

export type DataVideo = {
  src: string;
  fallback?: string[];
  image: string;
  thumbnail?: string;
  title?:string;
}