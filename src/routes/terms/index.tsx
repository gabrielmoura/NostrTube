import { createFileRoute } from "@tanstack/react-router";
import { t } from "i18next";
import { ScrollArea } from "@/components/ui/scroll-area.tsx";

export const Route = createFileRoute("/terms/")({
  component: RouteComponent,
  head: () => ({
    meta: [
      { title: t("Terms_Title") },
      { description: t("Terms_Description") },
      { property: "og:title", content: t("Terms_Title") }
    ]
  })
});

const sections = [
  { id: "descricao", title: "1. Descrição da Plataforma" },
  { id: "descentralizacao", title: "2. Natureza Descentralizada" },
  { id: "uso", title: "3. Uso da Plataforma" },
  { id: "responsabilidade", title: "4. Responsabilidade do Usuário" },
  { id: "limitacao", title: "5. Limitação de Responsabilidade" },
  { id: "privacidade", title: "6. Privacidade e Dados" },
  { id: "alteracoes", title: "7. Alterações" },
  { id: "encerramento", title: "8. Encerramento" },
  { id: "contato", title: "9. Contato" },
];

function RouteComponent() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Termos de Uso
        </h1>
        <p className="mt-2 text-muted-foreground">
          Última atualização: Janeiro de 2026
        </p>
      </div>

      <div className="mb-10 rounded-lg border bg-card p-4">
        <p className="text-sm leading-relaxed text-card-foreground">
          <strong>Atenção:</strong> Este documento é um modelo informativo e não substitui a revisão por um advogado. Plataformas descentralizadas levantam questões legais e de responsabilidade específicas.
        </p>
      </div>

      <div className="lg:grid lg:grid-cols-[220px_1fr] lg:gap-8">
        <nav className="sticky top-24 mb-8 hidden h-fit max-h-[calc(100vh-8rem)] overflow-y-auto lg:block">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Nesta página
          </h2>
          <ul className="space-y-1.5">
            {sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="block text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  {section.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-10">
          <section id="descricao">
            <h2 className="mb-3 text-xl font-semibold tracking-tight">1. Descrição da Plataforma</h2>
            <p className="leading-relaxed text-muted-foreground">
              A <strong className="text-foreground">{import.meta.env.VITE_APP_NAME}</strong> é uma plataforma de compartilhamento de vídeos construída sobre o protocolo <strong className="text-foreground">Nostr</strong>, que utiliza uma rede descentralizada de servidores (relays) para armazenar e distribuir conteúdo. Não existe um servidor central que controle todo o conteúdo; a plataforma indexa e apresenta informações publicamente disponíveis nos relays.
            </p>
          </section>

          <section id="descentralizacao">
            <h2 className="mb-3 text-xl font-semibold tracking-tight">2. Natureza Descentralizada e Ausência de Censura</h2>
            <p className="leading-relaxed text-muted-foreground">
              A plataforma não exerce controle editorial centralizado sobre o conteúdo publicado. O protocolo Nostr permite que qualquer pessoa publique conteúdo em relays compatíveis.
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>A moderação é local e opcional, variando entre relays.</li>
              <li>A plataforma não garante remoção de conteúdos ofensivos, imprecisos ou ilegais.</li>
              <li>Usuários que desejam filtragem devem usar relays com políticas de moderação ou aplicar filtros locais.</li>
            </ul>
          </section>

          <section id="uso">
            <h2 className="mb-3 text-xl font-semibold tracking-tight">3. Uso da Plataforma</h2>
            <p className="leading-relaxed text-muted-foreground">
              Ao utilizar a plataforma, você concorda em não publicar conteúdos que:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>Violem leis locais, nacionais ou internacionais aplicáveis;</li>
              <li>Contenham pornografia infantil, incitação à violência, terrorismo ou discriminação;</li>
              <li>Infrinjam direitos autorais ou privacidade de terceiros;</li>
              <li>Comprometam a segurança de terceiros (por exemplo, divulgação de dados pessoais sem consentimento).</li>
            </ul>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              O descumprimento pode resultar na remoção do conteúdo do índice da plataforma e/ou restrição de acesso, sem que isso implique na exclusão dos dados nos relays.
            </p>
          </section>

          <section id="responsabilidade">
            <h2 className="mb-3 text-xl font-semibold tracking-tight">4. Responsabilidade do Usuário</h2>
            <p className="leading-relaxed text-muted-foreground">
              Você é o único responsável por todo o conteúdo que publicar, transmitir ou compartilhar através da plataforma ou do protocolo Nostr. Isso inclui garantir que possui direitos sobre o material e compreender que o conteúdo pode ser replicado em diversos relays.
            </p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Devido à natureza descentralizada, não é possível garantir a exclusão completa ou a retirada definitiva de conteúdos já publicados na rede Nostr.
            </p>
          </section>

          <section id="limitacao">
            <h2 className="mb-3 text-xl font-semibold tracking-tight">5. Limitação de Responsabilidade</h2>
            <p className="leading-relaxed text-muted-foreground">
              A <strong className="text-foreground">{import.meta.env.VITE_APP_NAME}</strong> não se responsabiliza por danos diretos, indiretos, incidentais, consequentes ou punitivos decorrentes do uso da plataforma, por conteúdo publicado por terceiros, falhas de relays externos, perda de dados ou indisponibilidade de serviços de terceiros.
            </p>
            <p className="mt-3 leading-relaxed text-muted-foreground">O uso da plataforma é feito por sua conta e risco.</p>
          </section>

          <section id="privacidade">
            <h2 className="mb-3 text-xl font-semibold tracking-tight">6. Privacidade e Dados</h2>
            <p className="leading-relaxed text-muted-foreground">
              Por operar sobre o protocolo Nostr, a plataforma não exige necessariamente dados pessoais tradicionais (como e-mail ou CPF) para navegação básica. Seu identificador primário na rede é a sua <strong className="text-foreground">chave pública Nostr</strong> e suas interações são registradas publicamente nos relays.
            </p>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              Recomenda-se fortemente que você evite compartilhar informações pessoais sensíveis em vídeos, comentários ou perfis, pois esses dados podem ser replicados e arquivados permanentemente por terceiros.
            </p>
          </section>

          <section id="alteracoes">
            <h2 className="mb-3 text-xl font-semibold tracking-tight">7. Alterações destes Termos</h2>
            <p className="leading-relaxed text-muted-foreground">
              Podemos atualizar estes Termos periodicamente. A data da última atualização constará no topo do documento. O uso contínuo da plataforma após alterações implica aceitação dos Termos atualizados.
            </p>
          </section>

          <section id="encerramento">
            <h2 className="mb-3 text-xl font-semibold tracking-tight">8. Encerramento e Exclusão</h2>
            <p className="leading-relaxed text-muted-foreground">
              Você pode deixar de usar a plataforma a qualquer momento. A remoção do seu perfil local na plataforma não implica na exclusão dos dados já publicados nos relays, que permanecem públicos em função do protocolo Nostr.
            </p>
          </section>

          <section id="contato">
            <h2 className="mb-3 text-xl font-semibold tracking-tight">9. Contato</h2>
            <p className="leading-relaxed text-muted-foreground">
              Dúvidas sobre estes Termos podem ser enviadas para:
            </p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
              <li>
                Npub:{" "}
                <a
                  href="https://njump.me/npub1733g4vyyqjkan972u90zfysguc09vvcvkwhmesacpd73ljf4jqlsrz0sq8"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  Perfil no Nostr
                </a>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
