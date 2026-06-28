import { ImageIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader } from "@/routes/configuration/@components/CommonComponents";
import {
  useImageProxySettingsStore,
  type ImageProxyMode,
} from "@/store/useImageProxySettingsStore.ts";

export function ImageProxySettings() {
  const { t } = useTranslation();
  const imageProxy = useImageProxySettingsStore((state) => state.imageProxy);
  const setImageProxyMode = useImageProxySettingsStore((state) => state.setImageProxyMode);
  const setImgproxyBaseUrl = useImageProxySettingsStore((state) => state.setImgproxyBaseUrl);
  const setImageproxyBaseUrl = useImageProxySettingsStore((state) => state.setImageproxyBaseUrl);

  const activeBaseUrl = imageProxy.mode === "imgproxy" ? imageProxy.imgproxyBaseUrl : imageProxy.imageproxyBaseUrl;
  const activeBaseUrlSetter = imageProxy.mode === "imgproxy" ? setImgproxyBaseUrl : setImageproxyBaseUrl;

  return (
    <Card>
      <CardHeader
        title={t("image_proxy.title")}
        description={t("image_proxy.description")}
        icon={ImageIcon}
      />
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
          <div className="space-y-2">
            <Label htmlFor="image-proxy-mode">{t("image_proxy.mode_label")}</Label>
            <Select value={imageProxy.mode} onValueChange={(value) => setImageProxyMode(value as ImageProxyMode)}>
              <SelectTrigger id="image-proxy-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t("image_proxy.options.none")}</SelectItem>
                <SelectItem value="imgproxy">{t("image_proxy.options.imgproxy")}</SelectItem>
                <SelectItem value="imageproxy">{t("image_proxy.options.imageproxy")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image-proxy-base-url">{t("image_proxy.base_url_label")}</Label>
            <Input
              id="image-proxy-base-url"
              value={imageProxy.mode === "none" ? "" : activeBaseUrl}
              onChange={(event) => activeBaseUrlSetter(event.target.value)}
              placeholder={imageProxy.mode === "imageproxy" ? "https://example.com/api/imageproxy" : "https://imgproxy.example.com"}
              disabled={imageProxy.mode === "none"}
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {imageProxy.mode === "none"
            ? t("image_proxy.helper_none")
            : imageProxy.mode === "imgproxy"
              ? t("image_proxy.helper_imgproxy")
              : t("image_proxy.helper_imageproxy")}
        </p>
      </CardContent>
    </Card>
  );
}
