import { useDebouncedValue } from '@tanstack/react-pacer'
import { createRoute, Link } from '@tanstack/react-router'
import { t } from 'i18next'
import { HelpCircle, Search, ShieldCheck, Sparkles } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion.tsx'
import { buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input.tsx'
import { faqData } from '@/default.ts'
import { detectLanguageMain } from '@/helper/userLang.ts'
import { Route as rootRoute } from '@/routes/__root'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/faq',
  component: RouteComponent,
  head: () => ({
    meta: [
      { title: t('FAQ_Title', 'FAQ') },
      {
        name: 'description',
        content: t(
          'FAQ_Description',
          'Frequently Asked Questions about NostrTube. Find answers to common questions and learn more about our platform.',
        ),
      },
      { property: 'og:title', content: t('FAQ_Title', 'FAQ') },
    ],
  }),
})

export interface FaqEntry {
  id: string
  question: string
  answer: string
}

function FaqPage({ faqData }: { faqData: FaqEntry[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, searchDebouncer] = useDebouncedValue(
    searchTerm,
    { wait: 200, key: 'faq-search' },
    (state) => ({
      isPending: state.isPending,
    }),
  )

  const filteredFaqs = useMemo(() => {
    if (!debouncedSearchTerm) return faqData
    const lower = debouncedSearchTerm.toLowerCase()
    return faqData.filter(
      (faq) => faq.question.toLowerCase().includes(lower) || faq.answer.toLowerCase().includes(lower),
    )
  }, [debouncedSearchTerm, faqData])

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-12">
      <div className="mb-8 rounded-3xl border border-border/70 bg-gradient-to-br from-card/90 via-card/70 to-primary/5 px-6 py-8 text-center shadow-sm">
        <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <HelpCircle className="size-6" />
        </div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
          <Sparkles className="size-3.5" />
          Knowledge Base
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Perguntas Frequentes</h1>
        <p className="mt-2 text-muted-foreground">
          Encontre respostas para as dúvidas mais comuns sobre o {import.meta.env.VITE_APP_NAME}.
        </p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Link to="/terms" className={buttonVariants({ variant: 'glass' })}>
            <ShieldCheck className="mr-2 size-4" />
            Ler termos
          </Link>
        </div>
      </div>

      <div className="relative mb-8 rounded-2xl border border-border/60 bg-card/70 p-3 shadow-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar perguntas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-11 rounded-xl border-border/60 bg-background/70 pl-9"
        />
        {searchDebouncer.state.isPending ? (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Filtrando...</span>
        ) : null}
      </div>

      {filteredFaqs.length > 0 ? (
        <Accordion
          type="single"
          collapsible
          className="w-full rounded-3xl border border-border/70 bg-card/80 shadow-sm"
        >
          {filteredFaqs.map((faq) => (
            <AccordionItem key={faq.id} value={faq.id} className="border-b border-border last:border-b-0">
              <AccordionTrigger className="flex w-full items-center justify-between px-5 py-4 text-left text-base font-medium text-foreground transition-colors hover:bg-muted/50 hover:no-underline data-[state=open]:bg-muted/30">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-2 [&_a]:hover:underline">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="rounded-3xl border border-border/70 bg-card/80 p-8 text-center shadow-sm">
          <p className="text-muted-foreground">Nenhum resultado encontrado para "{searchTerm}".</p>
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="mt-2 text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Limpar busca
          </button>
        </div>
      )}
    </div>
  )
}

function RouteComponent() {
  const lang = detectLanguageMain() || 'en'
  const faqDataL = faqData[lang?.split('-')[0] as keyof typeof faqData] || faqData['en']
  return (
    <AppShell
      title="Perguntas Frequentes"
      description="Encontre respostas para as dúvidas mais comuns."
      icon={HelpCircle}
    >
      <FaqPage faqData={faqDataL} />
    </AppShell>
  )
}
