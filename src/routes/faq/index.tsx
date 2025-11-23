import { createFileRoute } from "@tanstack/react-router";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion.tsx";
import { useEffect, useState } from "react";
import { Command, CommandEmpty, CommandInput, CommandList } from "@/components/ui/command.tsx";
import { faqData } from "@/default.ts";
import { detectLanguageMain } from "@/helper/userLang.ts";
import { Helmet } from "react-helmet-async";
import { t } from "i18next";


export const Route = createFileRoute("/faq/")({
  component: RouteComponent
});


function RouteComponent() {
  const lang = detectLanguageMain() || "en";
  const faqDataL = faqData[lang?.split("-")[0] as keyof typeof faqData] || faqData["en"];
  return (
    <div className="min-h-screen bg-gray-100">
      <Helmet>
        <title>{t("FAQ_Title", "FAQ")} - {import.meta.env.VITE_APP_NAME}</title>
        <meta name="description"
              content={t("FAQ_Description", "Frequently Asked Questions about NostrTube. Find answers to common questions and learn more about our platform.")} />
      </Helmet>
      <FaqPage faqData={faqDataL} />
    </div>
  );
}


export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

function FaqItem({ id, question, answer }: FaqEntry) {
  return (
    <AccordionItem value={id} className="border-b border-gray-200">
      <AccordionTrigger
        className="flex justify-between items-center w-full py-4 px-6 text-lg font-medium text-gray-900 hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500 focus-visible:ring-opacity-75 transition-all duration-200">
        {question}
      </AccordionTrigger>
      <AccordionContent className="px-6 pb-4 text-base text-gray-700 leading-relaxed">
        {answer}
      </AccordionContent>
    </AccordionItem>
  );
}

function FaqPage({ faqData }: { faqData: FaqEntry[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFaqs, setFilteredFaqs] = useState<FaqEntry[]>([]);

  useEffect(() => {
    setFilteredFaqs(faqData);
  }, [faqData]);

  useEffect(() => {
    if (searchTerm === "") {
      setFilteredFaqs(faqData);
    } else {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      const results = faqData.filter(faq =>
        faq.question.toLowerCase().includes(lowercasedSearchTerm) ||
        faq.answer.toLowerCase().includes(lowercasedSearchTerm)
      );
      setFilteredFaqs(results);
    }
  }, [searchTerm, faqData]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-4xl font-bold text-center text-gray-900 mb-10">
        Perguntas Frequentes
      </h1>

      <Command className="rounded-lg border shadow-md mb-8">
        <CommandInput
          placeholder="Buscar perguntas frequentes..."
          value={searchTerm}
          onValueChange={setSearchTerm}
          className="p-4 text-lg"
        />
        <CommandList>
          {filteredFaqs?.length === 0 && searchTerm !== "" && (
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          )}
        </CommandList>
      </Command>

      {filteredFaqs?.length > 0 ? (
        <Accordion type="single" collapsible className="w-full bg-white shadow-lg rounded-lg">
          {filteredFaqs?.map((faq) => (
            <FaqItem key={faq.id} id={faq.id} question={faq.question} answer={faq.answer} />
          ))}
        </Accordion>
      ) : (
        searchTerm !== "" &&
        <p className="text-center text-gray-600">Nenhuma pergunta frequente corresponde à sua busca.</p>
      )}
    </div>
  );
}
