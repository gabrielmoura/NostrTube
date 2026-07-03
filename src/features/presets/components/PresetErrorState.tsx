import { AlertCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function PresetErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation('settings')

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 py-10 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <div>
          <p className="font-medium">{t('presets.errorTitle')}</p>
          <p className="mt-1 text-sm text-muted-foreground">{t('presets.errorDescription')}</p>
        </div>
        <Button variant="outline" onClick={onRetry}>
          {t('presets.refresh')}
        </Button>
      </CardContent>
    </Card>
  )
}
