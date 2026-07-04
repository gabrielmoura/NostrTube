import { Globe2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/routes/configuration/@components/CommonComponents'
import { type CorsProxyMode, useImageProxySettingsStore } from '@/store/useImageProxySettingsStore.ts'

export function CorsProxySettings() {
  const { t } = useTranslation()
  const corsProxy = useImageProxySettingsStore((state) => state.corsProxy)
  const setCorsProxyMode = useImageProxySettingsStore((state) => state.setCorsProxyMode)
  const setCorsProxyCustomBaseUrl = useImageProxySettingsStore((state) => state.setCorsProxyCustomBaseUrl)

  return (
    <Card>
      <CardHeader title={t('cors_proxy.title')} description={t('cors_proxy.description')} icon={Globe2} />
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,220px)_1fr]">
          <div className="space-y-2">
            <Label htmlFor="cors-proxy-mode">{t('cors_proxy.mode_label')}</Label>
            <Select value={corsProxy.mode} onValueChange={(value) => setCorsProxyMode(value as CorsProxyMode)}>
              <SelectTrigger id="cors-proxy-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{t('cors_proxy.options.none')}</SelectItem>
                <SelectItem value="custom">{t('cors_proxy.options.custom')}</SelectItem>
                <SelectItem value="corsproxy_io">{t('cors_proxy.options.corsproxy_io')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cors-proxy-base-url">{t('cors_proxy.custom_url_label')}</Label>
            <Input
              id="cors-proxy-base-url"
              value={corsProxy.customBaseUrl}
              onChange={(event) => setCorsProxyCustomBaseUrl(event.target.value)}
              placeholder="https://cors.example.com"
              disabled={corsProxy.mode !== 'custom'}
            />
          </div>
        </div>

        <p className="text-sm text-muted-foreground">
          {corsProxy.mode === 'corsproxy_io'
            ? t('cors_proxy.helper_corsproxy_io')
            : corsProxy.mode === 'custom'
              ? t('cors_proxy.helper_custom')
              : t('cors_proxy.helper_none')}
        </p>
      </CardContent>
    </Card>
  )
}
