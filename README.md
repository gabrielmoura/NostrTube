# NostrTube
Uma plataforma de vídeo descentralizada alimentada pelo protocolo Nostr.

![GitHub issues](https://img.shields.io/github/issues/gabrielmoura/NostrTube)
![GitHub forks](https://img.shields.io/github/forks/gabrielmoura/NostrTube)
![GitHub stars](https://img.shields.io/github/stars/gabrielmoura/NostrTube)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/gabrielmoura/NostrTube)


## 📖 Sobre

NostrTube é uma aplicação de compartilhamento de vídeos descentralizada que utiliza o protocolo Nostr para armazenamento e distribuição de conteúdo. A plataforma permite aos usuários fazer upload, assistir e compartilhar vídeos de forma descentralizada, sem depender de servidores centralizados.

## ✨ Funcionalidades

- 📹 Upload e compartilhamento de vídeos
- 🔍 Busca de conteúdo
- 👤 Perfis de usuário
- 💬 Feedback direto via Nostr com POW e ZAP opcional
- 🎬 Player de vídeo com suporte a HLS e DASH
- 🌐 Nexus P2P Sidecar inspirado no fluxo NIP-95 para cache distribuído de eventos
- 📱 Aplicativo móvel (Android/iOS) via Capacitor
- 🌐 Progressive Web App (PWA)
- 🌍 Suporte multilíngue (i18n)
- 🎨 Interface moderna com tema claro/escuro
- 🔐 Autenticação descentralizada via Nostr

## 🛠️ Tecnologias

### Frontend
- **React 19** - Biblioteca UI
- **TypeScript** - Linguagem de programação
- **Vite** - Build tool e dev server
- **TanStack Router** - Roteamento
- **TanStack Query** - Gerenciamento de estado assíncrono
- **Tailwind CSS** - Framework CSS
- **Radix UI** - Componentes acessíveis

### Nostr & Blockchain
- **NDK (Nostr Development Kit)** - Kit de desenvolvimento Nostr
- **nostr-tools** - Ferramentas Nostr
- **Blossom Client SDK** - Cliente para armazenamento de mídia
- **Nexus P2P / NIP-95** - Sidecar WebRTC para distribuição híbrida de eventos Nostr

### Vídeo
- **Vidstack** - Player de vídeo
- **HLS.js** - Streaming HLS
- **Dash.js** - Streaming DASH

### Mobile
- **Capacitor** - Framework para aplicativos nativos

## 📋 Pré-requisitos

- Node.js 20 ou superior
- pnpm 10.24.0 ou superior

## 🚀 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/gabrielmoura/NostrTube.git
cd NostrTube
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure o ambiente:
```bash
cp .env.example .env
```

### Variáveis importantes

- `VITE_NOSTR_FEEDBACK_RECIPIENT_NPUB`: destinatário das mensagens de feedback.
  - Se não for definido, a aplicação usa `npub1733g4vyyqjkan972u90zfysguc09vvcvkwhmesacpd73ljf4jqlsrz0sq8`.
  - O valor é validado como `npub` NIP-19 e convertido internamente para pubkey hex.
- `VITE_APP_IMAGE_PROXY_MODE`: modo inicial do proxy de imagem. Valores aceitos: `none`, `imgproxy`, `nostube-imgproxy`, `imageproxy`.
  - Se não for definido e `VITE_APP_NOSTUBE_IMGPROXY` existir, o padrão será `nostube-imgproxy`.
  - Se não for definido e `VITE_APP_NOSTUBE_IMGPROXY` não existir, o padrão será `none`.
- `VITE_APP_IMGPROXY`: URL base de um servidor `imgproxy` compatível com `/insecure/...`. Para usá-la como padrão, defina `VITE_APP_IMAGE_PROXY_MODE=imgproxy`.
- `VITE_APP_NOSTUBE_IMGPROXY`: URL base de uma instância [`nostube-imgproxy`](https://github.com/flox1an/nostube-imgproxy).
  - Quando definida e `VITE_APP_IMAGE_PROXY_MODE` não estiver definido, ela é usada como modo padrão de proxy de imagem.
  - Esse modo usa `/insecure/<directives>/plain/<url-codificada>` e pode derivar thumbnails de URLs de vídeo com FFmpeg no servidor.
- `VITE_NEXUS_P2P_RELAY_URL`: relay de signaling do Nexus P2P Sidecar.
  - Se não for definido, a aplicação usa `wss://nexus.libernet.app`.
- `VITE_NEXUS_P2P_ENABLED`: controle global do sidecar P2P.
  - Use `false` para desativar a integração em build/runtime.

### Proxy de imagens

Em `Configurações > Relays & Blossom > Proxy de imagens`, a aplicação suporta:

- `Nenhum`: usa a URL original da imagem.
- `imgproxy`: usa a geração de URL via `@imgproxy/imgproxy-js-core`.
- `nostube-imgproxy`: usa o formato compatível com imgproxy de `nostube-imgproxy`, gerando URLs como `https://proxy.example/insecure/f:webp/rs:fit:480:480/plain/<url-codificada>`.
- `imageproxy`: usa o formato simples `/opções/url-remota`.

O modo `nostube-imgproxy` é recomendado quando a fonte pode ser vídeo (`mp4`, `webm`, `m3u8` etc.), porque o servidor consegue extrair uma thumbnail e retornar uma imagem otimizada.

### NIP-95 / Nexus P2P

O projeto possui uma implementação cliente-side chamada **Nexus P2P Sidecar**, inspirada no fluxo NIP-95 de distribuição híbrida Relay-P2P via WebRTC. Ela usa WebRTC para distribuir eventos Nostr entre peers enquanto mantém fallback normal via relay/NDK.

No estado atual, o app implementa registro de peer, anúncio de cache, signaling, requisição/resposta de eventos por Data Channel e métricas de debug. O relay seed/signaling server, reputação de peers e promoção formal para Super Peer não são implementados no frontend.

Essa camada não distribui arquivos de mídia. Uploads e thumbnails continuam usando Blossom, URLs públicas, DVMs ou proxies de imagem; o Nexus P2P atua apenas sobre eventos Nostr.

## 💻 Desenvolvimento

Execute o servidor de desenvolvimento:

```bash
pnpm dev
```

A aplicação estará disponível em `http://localhost:5173`

### Outros comandos úteis

```bash
# Build para produção
pnpm build

# Preview do build
pnpm preview

# Lint do código
pnpm lint

# Formatação do código
pnpm format

# Análise do bundle
pnpm analyze
```

## 📱 Build Mobile

### Android
```bash
pnpm build
npx cap sync android
npx cap open android
```

### iOS
```bash
pnpm build
npx cap sync ios
npx cap open ios
```

## 🐳 Docker

Build da imagem:
```bash
docker build -t nostrtube .
```

Executar o container:
```bash
docker run -p 3000:80 nostrtube
```

## 📁 Estrutura do Projeto

```
NostrTube/
├── src/
│   ├── components/     # Componentes React
│   ├── config/         # Configuração centralizada de ambiente e features
│   ├── features/       # Features de domínio isoladas
│   ├── routes/         # Rotas da aplicação
│   ├── hooks/          # Hooks customizados
│   ├── lib/            # Bibliotecas e utilitários
│   ├── store/          # Gerenciamento de estado
│   └── context/        # Context providers
├── docs/               # Documentação técnica de arquitetura frontend
├── public/             # Arquivos estáticos
├── android/            # Projeto Android (Capacitor)
└── ios/                # Projeto iOS (Capacitor)
```

## 💬 Fluxo de Feedback

- O botão `Feedback` fica no header da aplicação.
- O modal envia uma mensagem privada NIP-17 para o destinatário configurado.
- O conteúdo inclui título, categoria e idioma do navegador quando disponível.
- Se um valor de ZAP for selecionado, a aplicação:
  - envia primeiro a mensagem privada
  - resolve o usuário com `ndk.fetchUser(...)`
  - tenta o pagamento com `NDKZapper`
  - usa WebLN quando disponível ou abre a invoice Lightning real quando necessário

### Referência rápida

- Arquitetura: `docs/frontend-architecture.md`
- Componentes: `docs/components-tree.md`
- Estado: `docs/state-management.md`
- Decisões: `docs/decisions-frontend.md`
- NIP-95 / Nexus P2P: `docs/nip-95-nexus-p2p.md`

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença especificada no arquivo LICENSE.

## 👤 Autor

**Gabriel Moura**
- Email: gmouradev96@gmail.com
- GitHub: [@gabrielmoura](https://github.com/gabrielmoura)

## 🔗 Links

- [Website](https://nostrtube.vercel.app)
- [Protocolo Nostr](https://nostr.com)

---

Feito com ❤️ usando Nostr
