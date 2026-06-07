import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion.tsx";
import { useEffect, useMemo, useState } from "react";
import { faqData } from "@/default.ts";
import { detectLanguageMain } from "@/helper/userLang.ts";
import { t } from "i18next";
import { Input } from "@/components/ui/input.tsx";
import { Search, HelpCircle } from "lucide-react";

export const Route = createFileRoute("/faq/")({
  component: RouteComponent,
  head: () => ({
    meta: [
      { title: t("FAQ_Title", "FAQ") },
      {
        name: "description",
        content: t("FAQ_Description", "Frequently Asked Questions about NostrTube. Find answers to common questions and learn more about our platform.")
      },
      { property: "og:title", content: t("FAQ_Title", "FAQ") }
    ]
  })
});

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

function FaqPage({ faqData }: { faqData: FaqEntry[] }) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFaqs = useMemo(() => {
    if (!searchTerm) return faqData;
    const lower = searchTerm.toLowerCase();
    return faqData.filter(
      (faq) =>
        faq.question.toLowerCase().includes(lower) ||
        faq.answer.toLowerCase().includes(lower)
    );
  }, [searchTerm, faqData]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <HelpCircle className="size-6" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Perguntas Frequentes
        </h1>
        <p className="mt-2 text-muted-foreground">
          Encontre respostas para as dúvidas mais comuns sobre o {import.meta.env.VITE_APP_NAME}.
        </p>
      </div>

      <div className="relative mb-8">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar perguntas..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {filteredFaqs.length > 0 ? (
        <Accordion type="single" collapsible className="w-full rounded-lg border bg-card">
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
        <div className="rounded-lg border bg-card p-8 text-center">
          <p className="text-muted-foreground">Nenhum resultado encontrado para "{searchTerm}".</p>
          <button
            type="button"
            onClick={() => setSearchTerm("")}
            className="mt-2 text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Limpar busca
          </button>
        </div>
      )}
    </div>
  );
}

function RouteComponent() {
  const lang = detectLanguageMain() || "en";
  const faqDataL = faqData[lang?.split("-")[0] as keyof typeof faqData] || faqData["en"];
  return (
    <FaqPage faqData={faqDataL} />
  );
}
