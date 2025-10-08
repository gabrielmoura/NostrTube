import {createFileRoute} from '@tanstack/react-router'
import {Card} from "@radix-ui/themes";

export const Route = createFileRoute('/terms/')({
    component: RouteComponent,
})

function RouteComponent() {
    return <div className="flex justify-center py-2.5">
        <Card>
            <div className="text-sm font-semibold">Aviso Legal</div>
            <p className="text-xs leading-relaxed prose">
                <div class="notice">
                    ⚠️ <strong>Atenção:</strong> Este documento é um modelo informativo e não substitui a revisão por um
                    advogado. Plataformas descentralizadas levantam questões legais e de responsabilidade específicas.
                </div>

                <hr/>

                <section>
                    <h2>1. Descrição da Plataforma</h2>
                    <p>
                        A <strong>[Nome da Plataforma]</strong> é uma plataforma de compartilhamento de vídeos
                        construída sobre o protocolo <strong>Nostr</strong>,
                        que utiliza uma rede descentralizada de servidores (relays) para armazenar e distribuir
                        conteúdo.
                        Não existe um servidor central que controle todo o conteúdo; a plataforma indexa e apresenta
                        informações publicamente disponíveis nos relays.
                    </p>
                </section>

                <section>
                    <h2>2. Natureza Descentralizada e Ausência de Censura</h2>
                    <p>
                        A plataforma não exerce controle editorial centralizado sobre o conteúdo publicado. O protocolo
                        Nostr permite que qualquer pessoa publique conteúdo em relays compatíveis.
                    </p>
                    <ul>
                        <li>A moderação é local e opcional, variando entre relays.</li>
                        <li>A plataforma não garante remoção de conteúdos ofensivos, imprecisos ou ilegais.</li>
                        <li>Usuários que desejam filtragem devem usar relays com políticas de moderação ou aplicar
                            filtros locais.
                        </li>
                    </ul>
                </section>

                <section>
                    <h2>3. Uso da Plataforma</h2>
                    <p>Ao utilizar a plataforma, você concorda em não publicar conteúdos que:</p>
                    <ul>
                        <li>Violem leis locais, nacionais ou internacionais aplicáveis;</li>
                        <li>Contenham pornografia infantil, incitação à violência, terrorismo ou discriminação;</li>
                        <li>Infrinjam direitos autorais ou privacidade de terceiros;</li>
                        <li>Comprometam a segurança de terceiros (por exemplo, divulgação de dados pessoais sem
                            consentimento).
                        </li>
                    </ul>
                    <p>O descumprimento pode resultar na remoção do conteúdo do índice da plataforma e/ou restrição de
                        acesso, sem que isso implique na exclusão dos dados nos relays.</p>
                </section>

                <section>
                    <h2>4. Responsabilidade do Usuário</h2>
                    <p>
                        Você é o único responsável por todo o conteúdo que publicar, transmitir ou compartilhar através
                        da plataforma ou do protocolo Nostr.
                        Isso inclui garantir que possui direitos sobre o material e compreender que o conteúdo pode ser
                        replicado em diversos relays.
                    </p>
                    <p>
                        Devido à natureza descentralizada, não é possível garantir a exclusão completa ou a retirada
                        definitiva de conteúdos já publicados na rede Nostr.
                    </p>
                </section>

                <section>
                    <h2>5. Limitação de Responsabilidade</h2>
                    <p>
                        A <strong>[Nome da Plataforma]</strong> não se responsabiliza por danos diretos, indiretos,
                        incidentais, consequentes ou punitivos decorrentes do uso da plataforma,
                        por conteúdo publicado por terceiros, falhas de relays externos, perda de dados ou
                        indisponibilidade de serviços de terceiros.
                    </p>
                    <p>O uso da plataforma é feito por sua conta e risco.</p>
                </section>

                <section>
                    <h2>6. Privacidade e Dados</h2>
                    <p>
                        Por operar sobre o protocolo Nostr, a plataforma não exige necessariamente dados pessoais
                        tradicionais (como e-mail ou CPF) para navegação básica.
                        Seu identificador primário na rede é a sua <strong>chave pública Nostr</strong> e suas
                        interações são registradas publicamente nos relays.
                    </p>
                    <p>
                        Recomenda-se fortemente que você evite compartilhar informações pessoais sensíveis em vídeos,
                        comentários ou perfis, pois esses dados podem ser replicados e arquivados permanentemente por
                        terceiros.
                    </p>
                </section>

                <section>
                    <h2>7. Direitos Autorais</h2>
                    <p>
                        Se você acredita que um conteúdo publicado viola seus direitos autorais, envie uma notificação
                        formal contendo:
                    </p>
                    <ul>
                        <li>Identificação do conteúdo supostamente infrator;</li>
                        <li>Prova de titularidade dos direitos autorais;</li>
                        <li>Informações de contato válidas.</li>
                    </ul>
                    <p>
                        Embora a plataforma não possa remover diretamente conteúdo dos relays externos, podemos:
                    </p>
                    <ul>
                        <li>Remover o conteúdo do índice da plataforma;</li>
                        <li>Notificar operadores dos relays identificados, quando aplicável.</li>
                    </ul>
                </section>

                <section>
                    <h2>8. Alterações destes Termos</h2>
                    <p>
                        Podemos atualizar estes Termos periodicamente. A data da última atualização constará no topo do
                        documento.
                        O uso contínuo da plataforma após alterações implica aceitação dos Termos atualizados.
                    </p>
                </section>

                <section>
                    <h2>9. Encerramento e Exclusão</h2>
                    <p>
                        Você pode deixar de usar a plataforma a qualquer momento. A remoção do seu perfil local na
                        plataforma não implica na exclusão dos dados já publicados nos relays,
                        que permanecem públicos em função do protocolo Nostr.
                    </p>
                </section>

                <section>
                    <h2>10. Legislação Aplicável</h2>
                    <p>
                        Estes Termos são regidos pelas leis da <strong>República Federativa do Brasil</strong>,
                        independentemente de onde o conteúdo esteja hospedado ou acessado.
                    </p>
                </section>

                <section id="contact">
                    <h2>11. Contato</h2>
                    <p>
                        Dúvidas sobre estes Termos podem ser enviadas para:
                    </p>
                    <ul>
                        <li>Email / suporte: <a href="mailto:suporte@exemplo.com">suporte@exemplo.com</a></li>
                        <li>Ou via Nostr: <code>npub... (chave pública de suporte)</code></li>
                    </ul>
                </section>
            </p>
        </Card>
    </div>
}
