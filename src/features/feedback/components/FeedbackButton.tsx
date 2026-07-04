import { t } from 'i18next'
import { MessageSquare } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FeedbackModal } from '@/features/feedback/components/FeedbackModal'
import { cn } from '@/lib/utils'

export function FeedbackButton({ className }: { className?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        aria-label={t('feedback.header_button_aria')}
        className={cn('gap-2', className)}
      >
        <MessageSquare className="size-4" />
        <span className="hidden sm:inline">{t('feedback.header_button')}</span>
      </Button>

      <FeedbackModal open={open} onOpenChange={setOpen} />
    </>
  )
}
