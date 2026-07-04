import { t } from 'i18next'
import {
  BookOpen,
  Bug,
  Gauge,
  HeartHandshake,
  KeyRound,
  Languages,
  LayoutPanelTop,
  Lightbulb,
  Lock,
  MessageSquare,
  PlayCircle,
  Search,
  Shield,
  Sparkles,
  Upload,
} from 'lucide-react'
import { FEEDBACK_CATEGORIES, type FeedbackCategoryValue } from '@/features/feedback/constants/feedbackCategories'
import { cn } from '@/lib/utils'

const iconMap = {
  book: BookOpen,
  bug: Bug,
  gauge: Gauge,
  heart: HeartHandshake,
  key: KeyRound,
  languages: Languages,
  layout: LayoutPanelTop,
  lightbulb: Lightbulb,
  lock: Lock,
  message: MessageSquare,
  play: PlayCircle,
  search: Search,
  shield: Shield,
  sparkles: Sparkles,
  upload: Upload,
} as const

interface FeedbackCategorySelectProps {
  value: FeedbackCategoryValue
  onChange: (value: FeedbackCategoryValue) => void
  disabled?: boolean
  errorMessage?: string
}

export function FeedbackCategorySelect({
  value,
  onChange,
  disabled = false,
  errorMessage,
}: FeedbackCategorySelectProps) {
  return (
    <div className="space-y-3">
      <div
        role="radiogroup"
        aria-invalid={Boolean(errorMessage)}
        aria-describedby={errorMessage ? 'feedback-category-error' : undefined}
        className="grid gap-2 sm:grid-cols-2"
      >
        {FEEDBACK_CATEGORIES.map((category) => {
          const Icon = iconMap[category.icon]
          const checked = category.value === value

          return (
            <button
              key={category.value}
              type="button"
              role="radio"
              aria-checked={checked}
              disabled={disabled}
              onClick={() => onChange(category.value)}
              className={cn(
                'rounded-xl border p-3 text-left transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                checked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-lg bg-muted p-2 text-muted-foreground">
                  <Icon className="size-4" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-foreground">{t(category.labelKey)}</p>
                  <p className="text-sm text-muted-foreground">{t(category.descriptionKey)}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      {errorMessage ? (
        <p id="feedback-category-error" className="text-sm text-destructive">
          {errorMessage}
        </p>
      ) : null}
    </div>
  )
}
