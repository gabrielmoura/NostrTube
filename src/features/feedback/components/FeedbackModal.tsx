import { useNDKCurrentUser } from '@nostr-dev-kit/ndk-hooks'
import { t } from 'i18next'
import { AlertCircle, CheckCircle2, Info, MessageSquare, ShieldAlert, Wallet } from 'lucide-react'
import { useEffect } from 'react'
import { Controller } from 'react-hook-form'
import { AuthModal } from '@/components/AuthModal'
import { modal } from '@/components/modal_v2/modal-manager'
import { useMediaQuery } from '@/components/modal_v2/use-media-query'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FeedbackCategorySelect } from '@/features/feedback/components/FeedbackCategorySelect'
import { FeedbackZapAmountSelect } from '@/features/feedback/components/FeedbackZapAmountSelect'
import { useFeedbackForm } from '@/features/feedback/hooks/useFeedbackForm'
import { useSubmitFeedback } from '@/features/feedback/hooks/useSubmitFeedback'
import { launchLightningInvoice } from '@/features/zap/services/zap.service'

interface FeedbackModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getPrimaryLabel(
  stage: ReturnType<typeof useSubmitFeedback>['stage'],
  successState: ReturnType<typeof useSubmitFeedback>['successState'],
) {
  if (successState) return t('feedback.actions.sent')

  switch (stage) {
    case 'preparing':
      return t('feedback.actions.preparing')
    case 'pow':
      return t('feedback.actions.calculating_pow')
    case 'signing':
      return t('feedback.actions.signing')
    case 'publishing':
      return t('feedback.actions.publishing')
    case 'zap':
      return t('feedback.actions.starting_zap')
    default:
      return t('feedback.actions.submit')
  }
}

export function FeedbackModal({ open, onOpenChange }: FeedbackModalProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const currentUser = useNDKCurrentUser()
  const { form, values, zapAmount, messagePlaceholder, clearDraft, resetToDefaults } = useFeedbackForm()
  const submission = useSubmitFeedback()

  const isBusy = submission.isSubmitting
  const primaryLabel = getPrimaryLabel(submission.stage, submission.successState)
  const messageLength = values.message.length
  const canSubmit = form.formState.isValid && !isBusy && !submission.successState
  const successZapInvoice = submission.successState?.zapInvoice

  useEffect(() => {
    if (!open) return
    const timer = window.setTimeout(() => form.setFocus('title'), 30)
    return () => window.clearTimeout(timer)
  }, [form, open])

  const handleCloseRequest = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true)
      return
    }

    if (isBusy) return

    if (form.formState.isDirty && !submission.successState) {
      const shouldClose = window.confirm(t('feedback.confirm_discard'))
      if (!shouldClose) return
    }

    submission.resetState()
    onOpenChange(false)
  }

  const handleSuccessReset = () => {
    clearDraft()
    resetToDefaults()
    submission.resetState()
  }

  const onSubmit = form.handleSubmit(async (formValues) => {
    const result = await submission.submit(formValues as unknown as Parameters<typeof submission.submit>[0])
    if (result) {
      clearDraft()
      resetToDefaults()
    }
  })

  const content = (
    <div className="space-y-6" aria-busy={isBusy}>
      {submission.successState ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 size-5 text-emerald-500" />
              <div>
                <p className="font-medium text-foreground">{t('feedback.success.title')}</p>
                <p className="text-sm text-muted-foreground">
                  {submission.successState.zapMessage || t('feedback.success.description')}
                </p>
              </div>
            </div>
          </div>

          {submission.successState.zapStatus === 'failed' ? (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm text-muted-foreground">
              {t('feedback.success.zap_failed_after_feedback')}
            </div>
          ) : null}

          <div className="rounded-2xl border bg-card p-4 text-sm">
            <p className="font-medium text-foreground">{t('feedback.success.feedback_id')}</p>
            <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
              {submission.successState.feedbackId}
            </p>
            <p className="mt-3 text-xs text-emerald-700 dark:text-emerald-400">
              {t('feedback.success.feedback_published')}
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-4 text-sm">
            <p className="font-medium text-foreground">{t('feedback.success.message_id')}</p>
            <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
              {submission.successState.messageId}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">{t('feedback.success.private_delivery_notice')}</p>
          </div>

          {submission.successState.zapStatus === 'invoice-ready' && successZapInvoice ? (
            <div className="rounded-2xl border bg-card p-4">
              <div className="flex items-start gap-3">
                <Wallet className="mt-0.5 size-5 text-primary" />
                <div className="space-y-3">
                  <p className="font-medium text-foreground">{t('feedback.success.complete_zap')}</p>
                  <p className="text-sm text-muted-foreground">{t('feedback.success.invoice_description')}</p>
                  <Button type="button" onClick={() => launchLightningInvoice(successZapInvoice)}>
                    {t('feedback.success.open_wallet')}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-6">
          {!currentUser ? (
            <div className="rounded-2xl border border-amber-500/40 bg-amber-500/5 p-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 size-5 text-amber-500" />
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-foreground">{t('feedback.auth_required.title')}</p>
                    <p className="text-sm text-muted-foreground">{t('feedback.auth_required.description')}</p>
                  </div>
                  <Button type="button" variant="outline" onClick={() => modal.show(<AuthModal />, { id: 'auth' })}>
                    {t('feedback.auth_required.action')}
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="feedback-title">{t('feedback.fields.title')}</Label>
            <Input
              id="feedback-title"
              maxLength={120}
              placeholder={t('feedback.fields.title_placeholder')}
              aria-invalid={Boolean(form.formState.errors.title)}
              aria-describedby={form.formState.errors.title ? 'feedback-title-error' : undefined}
              disabled={isBusy}
              {...form.register('title')}
            />
            {form.formState.errors.title ? (
              <p id="feedback-title-error" className="text-sm text-destructive">
                {form.formState.errors.title.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>{t('feedback.fields.category')}</Label>
            <Controller
              control={form.control}
              name="category"
              render={({ field, fieldState }) => (
                <FeedbackCategorySelect
                  value={field.value}
                  onChange={field.onChange}
                  disabled={isBusy}
                  errorMessage={fieldState.error?.message}
                />
              )}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="feedback-name">{t('feedback.fields.name')}</Label>
              <Input
                id="feedback-name"
                maxLength={80}
                placeholder={t('feedback.fields.name_placeholder')}
                aria-invalid={Boolean(form.formState.errors.name)}
                aria-describedby={form.formState.errors.name ? 'feedback-name-error' : undefined}
                disabled={isBusy}
                {...form.register('name')}
              />
              {form.formState.errors.name ? (
                <p id="feedback-name-error" className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label htmlFor="feedback-email">{t('feedback.fields.email')}</Label>
              <Input
                id="feedback-email"
                type="email"
                maxLength={160}
                placeholder={t('feedback.fields.email_placeholder')}
                aria-invalid={Boolean(form.formState.errors.email)}
                aria-describedby={form.formState.errors.email ? 'feedback-email-error' : undefined}
                disabled={isBusy}
                {...form.register('email')}
              />
              {form.formState.errors.email ? (
                <p id="feedback-email-error" className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              ) : null}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="feedback-message">{t('feedback.fields.message')}</Label>
              <span className="text-xs text-muted-foreground">{messageLength}/3000</span>
            </div>
            <Textarea
              id="feedback-message"
              maxLength={3000}
              placeholder={messagePlaceholder}
              className="min-h-[180px] resize-y"
              aria-invalid={Boolean(form.formState.errors.message)}
              aria-describedby={form.formState.errors.message ? 'feedback-message-error' : 'feedback-message-help'}
              disabled={isBusy}
              {...form.register('message')}
            />
            <p id="feedback-message-help" className="text-xs text-muted-foreground">
              {t('feedback.fields.message_help_private')}
            </p>
            {form.formState.errors.message ? (
              <p id="feedback-message-error" className="text-sm text-destructive">
                {form.formState.errors.message.message}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>{t('feedback.fields.zap')}</Label>
            <Controller
              control={form.control}
              name="zapPreset"
              render={({ field }) => (
                <FeedbackZapAmountSelect
                  preset={field.value}
                  customAmount={values.customZapAmount}
                  onPresetChange={field.onChange}
                  onCustomAmountChange={(value) =>
                    form.setValue('customZapAmount', value, { shouldDirty: true, shouldValidate: true })
                  }
                  disabled={isBusy}
                  errorMessage={form.formState.errors.customZapAmount?.message}
                />
              )}
            />
            {zapAmount ? <p className="text-xs text-muted-foreground">{t('feedback.fields.zap_help')}</p> : null}
          </div>

          {zapAmount ? (
            <div className="space-y-2">
              <Label htmlFor="feedback-zap-note">{t('feedback.fields.zap_note')}</Label>
              <Input
                id="feedback-zap-note"
                maxLength={240}
                placeholder={t('feedback.fields.zap_note_placeholder')}
                aria-invalid={Boolean(form.formState.errors.zapNote)}
                aria-describedby={form.formState.errors.zapNote ? 'feedback-zap-note-error' : undefined}
                disabled={isBusy}
                {...form.register('zapNote')}
              />
              {form.formState.errors.zapNote ? (
                <p id="feedback-zap-note-error" className="text-sm text-destructive">
                  {form.formState.errors.zapNote.message}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="rounded-2xl border bg-secondary/30 p-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <Info className="mt-0.5 size-4" />
              <div className="space-y-2">
                <p>{t('feedback.privacy.private_message_notice')}</p>
                <p>{t('feedback.privacy.technical_details_notice')}</p>
                <p>{t('feedback.privacy.security_notice')}</p>
              </div>
            </div>
          </div>

          {submission.stage === 'pow' ? (
            <div className="rounded-2xl border bg-card p-4">
              <div className="space-y-2">
                <p className="font-medium text-foreground">{t('feedback.progress.pow_title')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('feedback.progress.pow_attempts', {
                    count: submission.powProgress?.attempts?.toLocaleString() || 0,
                  })}
                </p>
              </div>
            </div>
          ) : null}

          {submission.errorMessage ? (
            <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 size-5 text-destructive" />
                <p className="text-sm text-foreground">{submission.errorMessage}</p>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )

  const footer = submission.successState ? (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button type="button" variant="outline" onClick={handleSuccessReset}>
        {t('feedback.actions.send_another')}
      </Button>
      <Button type="button" onClick={() => handleCloseRequest(false)}>
        {t('feedback.actions.close')}
      </Button>
    </div>
  ) : (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      <Button
        type="button"
        variant="outline"
        disabled={isBusy}
        onClick={isBusy ? submission.cancel : () => handleCloseRequest(false)}
      >
        {t('feedback.actions.cancel')}
      </Button>
      <Button type="submit" form="feedback-form" disabled={!canSubmit || !currentUser} isLoading={isBusy}>
        {primaryLabel}
      </Button>
    </div>
  )

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={handleCloseRequest}>
        <DialogContent
          className="flex max-h-[90svh] max-w-2xl flex-col overflow-hidden p-0"
          showCloseButton={!isBusy}
          onEscapeKeyDown={(event) => {
            if (isBusy) event.preventDefault()
          }}
          onPointerDownOutside={(event) => {
            if (isBusy) event.preventDefault()
          }}
        >
          <DialogHeader className="border-b px-6 py-4">
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="size-5" /> {t('feedback.modal_title')}
            </DialogTitle>
            <DialogDescription>{t('feedback.modal_description')}</DialogDescription>
          </DialogHeader>

          <form id="feedback-form" onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">{content}</div>
            <DialogFooter className="border-t px-6 py-4">{footer}</DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={handleCloseRequest} dismissible={!isBusy}>
      <DrawerContent className="flex max-h-[92svh] flex-col rounded-t-2xl">
        <DrawerHeader className="border-b text-left">
          <DrawerTitle className="flex items-center gap-2">
            <MessageSquare className="size-5" /> {t('feedback.modal_title')}
          </DrawerTitle>
          <DrawerDescription>{t('feedback.modal_description')}</DrawerDescription>
        </DrawerHeader>

        <form id="feedback-form" onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">{content}</div>
          <DrawerFooter className="border-t px-4 py-4">{footer}</DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  )
}
