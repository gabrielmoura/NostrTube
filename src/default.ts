import type { Language } from "@/components/ComboBox/ComboLanguage.tsx";
import type { FaqEntry } from "@/routes/faq";

export const COMBOBOX_LANGUAGES: Language[] = [
  { id: "zh", name: "Mandarin Chinese", native: "普通话 / 汉语" },
  { id: "es", name: "Spanish", native: "Español" },
  { id: "en", name: "English", native: "English" },
  { id: "hi", name: "Hindi", native: "हिन्दी" },
  { id: "ar", name: "Arabic", native: "العربية" },
  { id: "bn", name: "Bengali", native: "বাংলা" },
  { id: "pt", name: "Portuguese", native: "Português" },
  { id: "ru", name: "Russian", native: "Русский" },
  { id: "ja", name: "Japanese", native: "日本語" },
  { id: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ / پنجابی" }
];

// FAQ Data
const faqDataEn: FaqEntry[] = [
  {
    "id": "q1",
    "question": "Where are the videos hosted?",
    "answer": "Videos are hosted on Blossom servers chosen by the user as the default. Availability and performance are the responsibility of the selected provider."
  },
  {
    "id": "q2",
    "question": "Which video formats are supported?",
    "answer": "Supported videos must already be processed and optimized by the user before upload. The supported formats are DASH, HLS, and MP4."
  },
  {
    "id": "q3",
    "question": "How are the displayed videos indexed?",
    "answer": "Indexing is performed through full-text search using NIP-50, along with tags and kinds from popular relays. Results are stored in localStorage and displayed later."
  },
  {
    "id": "q4",
    "question": "How does authentication work?",
    "answer": "If the chosen method is a browser extension, every action must be confirmed by the user within the extension — usually through a pop-up window showing the details for audit purposes. If authentication is done using your nsec, it will be saved locally in your browser (localStorage)."
  },
  {
    "id": "q5",
    "question": "How is content moderation handled?",
    "answer": "There is no moderation. All videos are displayed exactly as they are indexed from public relays. It’s up to the user to filter and choose what they want to watch."
  },
  {
    "id": "q6",
    "question": "Which Nostr events are used?",
    "answer": "The app uses events with kinds 1, 21, 34235, and 34237 — the latter being used to count video views."
  },
  {
    "id": "q7",
    "question": "Where can I find the documentation?",
    "answer": "This application follows the standards defined in the official Nostr repository: https://github.com/nostr-protocol/nips."
  },
  {
    "id": "q8",
    "question": "What does this application do?",
    "answer": "This is just a frontend for the Nostr protocol. All data is stored on public relays compatible with the Nostr standard, with no centralized servers or external services involved."
  },
  {
    "id": "q9",
    "question": "What is the purpose of this application?",
    "answer": "This is an independent application — developed without financial support — aimed at making video consumption and uploads easier within the Nostr community. Created by a Brazilian developer, it may take some time to be translated into other languages. It’s a PWA in an early stage but designed to help new users visually understand Nostr’s potential. The app follows the KISS principle (Keep It Simple, Stupid), focusing on simplicity and usefulness. The source code remains private for now, as it’s not yet mature enough for external contributions."
  }
];

const faqDataPt: FaqEntry[] = [
  {
    "id": "q1",
    "question": "Onde os vídeos são hospedados?",
    "answer": "Os vídeos são hospedados em servidores Blossom escolhidos como padrão pelo próprio usuário. A disponibilidade e o desempenho ficam sob responsabilidade do provedor selecionado."
  },
  {
    "id": "q2",
    "question": "Quais formatos de vídeo são suportados?",
    "answer": "São suportados vídeos já processados e otimizados pelo usuário antes do upload, nos formatos DASH, HLS e MP4."
  },
  {
    "id": "q3",
    "question": "Como é feita a indexação dos vídeos exibidos?",
    "answer": "A indexação é realizada por meio de busca full-text usando NIP-50, além do uso de tags e kinds nos relays mais populares. Os resultados são armazenados no localStorage e exibidos posteriormente."
  },
  {
    "id": "q4",
    "question": "Como funciona a autenticação?",
    "answer": "Se a opção escolhida for uma extensão, cada ação precisará ser confirmada pelo usuário nela — normalmente através de uma janela pop-up contendo os detalhes para auditoria. Caso a autenticação seja feita com sua nsec, ela será salva localmente no seu navegador (localStorage)."
  },
  {
    "id": "q5",
    "question": "Como é feita a moderação de conteúdo?",
    "answer": "Não há qualquer tipo de moderação. Todos os vídeos são exibidos conforme são indexados dos relays públicos. O controle de conteúdo fica inteiramente a critério do usuário, que decide o que deseja assistir ou não."
  },
  {
    "id": "q6",
    "question": "Quais eventos Nostr são utilizados?",
    "answer": "São utilizados os eventos dos kinds 1, 21, 34235 e 34237 — sendo este último responsável por contabilizar as visualizações."
  },
  {
    "id": "q7",
    "question": "Onde posso encontrar a documentação?",
    "answer": "A aplicação segue os padrões definidos no repositório oficial do Nostr: https://github.com/nostr-protocol/nips."
  },
  {
    "id": "q8",
    "question": "O que esta aplicação faz?",
    "answer": "Esta aplicação é apenas um frontend para o padrão Nostr. Todos os dados são armazenados em relays públicos compatíveis com o protocolo, sem qualquer servidor centralizado ou serviço externo envolvido."
  },
  {
    "id": "q9",
    "question": "Qual é o objetivo desta aplicação?",
    "answer": "Trata-se de uma aplicação independente, desenvolvida sem apoio financeiro, com o objetivo de facilitar o consumo e o envio de vídeos para a comunidade Nostr. Criada por um desenvolvedor brasileiro, pode demorar um pouco para ser traduzida para outros idiomas. É um PWA ainda em estágio inicial, mas que busca ajudar novos usuários a compreender o potencial do Nostr de forma visual. O app adota a filosofia KISS (Keep It Simple, Stupid), priorizando simplicidade e utilidade. O código-fonte ainda é privado por não haver maturidade suficiente para colaboração externa."
  }, {
    "id": "q10",
    "question": "O que é um servidor Blossom?",
    "answer": "Servidores Blossom são serviços de hospedagem descentralizados que permitem aos usuários armazenar e distribuir vídeos de forma eficiente, aproveitando a infraestrutura da rede Nostr para garantir disponibilidade e desempenho. Veja: https://nips.nostr.com/B7"
  }
];
export const faqData = {
  en: faqDataEn,
  pt: faqDataPt
};

export interface BlossomServer {
  url: string;
  name: string;
  region: string;
}
// Mock Blossom servers data
export const MOCK_BLOSSOM_SERVERS: BlossomServer[] = [
  { url: "https://cdn.nostr.build", name: "Nostr.Build CDN", region: "Global" },
  { url: "https://cdn.satellite.earth", name: "Satellite CDN", region: "US" },
  { url: "https://blossom.primal.net", name: "Primal Storage", region: "EU" },
  { url: "https://media.nostr.band", name: "Nostr Band", region: "US" },
  { url: "https://cdn.void.cat", name: "Void Cat", region: "Global" },
  { url: "https://files.nostr.ch", name: "Nostr CH", region: "EU" }
];