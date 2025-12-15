import { useState } from "react";
import { RiArrowLeftLine, RiLinkM, RiSearchLine } from "react-icons/ri";
import { t } from "i18next";

import { Label } from "@/components/label.tsx";
import { Input } from "@/components/input.tsx";
import { Button } from "@/components/button.tsx";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Separator } from "@/components/ui/separator.tsx"; // Opcional, ou use <hr />
import { useVideoImporter } from "@/hooks/useVideoImporter.ts";
import { newVideoStore } from "@/store/videoUploadStore.ts";

export default function LoadVideoFromOthers() {
  // Estado local apenas para controle dos inputs antes do submit
  const [eventString, setEventString] = useState("");
  const [urlString, setUrlString] = useState("");

  const { importFromEvent, importFromUrl, isImporting } = useVideoImporter();

  const handleEventSearch = () => {
    importFromEvent(eventString);
  };

  const handleUrlImport = () => {
    importFromUrl(urlString);
  };

  return (
    <Card className="w-full max-w-lg mx-auto bg-muted/50 border-dashed">
      <CardHeader>
        <CardTitle className="text-lg">{t("import_video", "Import Video")}</CardTitle>
        <CardDescription>
          {t("import_video_desc", "Use an existing Nostr event or a direct URL link.")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Opção 1: Evento Nostr */}
        <div className="space-y-2">
          <Label htmlFor="nostr-event">
            {t("nostr_event_id", "Nostr Event ID (nevent/naddr)")}
          </Label>
          <div className="flex gap-2">
            <Input
              id="nostr-event"
              value={eventString}
              onChange={(e) => setEventString(e.target.value)}
              placeholder="naddr1... ou nevent1..."
              onKeyDown={(e) => e.key === "Enter" && handleEventSearch()}
            />
            <Button
              onClick={handleEventSearch}
              loading={isImporting}
              disabled={!eventString || isImporting}
              size="icon"
              variant="secondary"
            >
              <RiSearchLine className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground uppercase font-medium">
            {t("or", "OR")}
          </span>
          <Separator className="flex-1" />
        </div>

        {/* Opção 2: URL Direta */}
        <div className="space-y-2">
          <Label htmlFor="video-url">
            {t("video_url", "Direct Video URL")}
          </Label>
          <div className="flex gap-2">
            <Input
              id="video-url"
              value={urlString}
              onChange={(e) => setUrlString(e.target.value)}
              placeholder="https://example.com/video.mp4"
              onKeyDown={(e) => e.key === "Enter" && handleUrlImport()}
            />
            <Button
              onClick={handleUrlImport}
              disabled={!urlString}
              size="icon"
              variant="secondary"
            >
              <RiLinkM className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[0.8rem] text-muted-foreground">
            {t("youtube_warning", "Avoid YouTube links if possible.")}
          </p>
        </div>

        {/* Botão Voltar */}
        <div className="pt-2">
          <Button
            onClick={() => (newVideoStore.showEventInput = false)}
            variant="ghost"
            className="w-full gap-2 text-muted-foreground hover:text-foreground"
          >
            <RiArrowLeftLine />
            {t("back_to_upload", "Back to file upload")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}