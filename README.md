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
- 🎬 Player de vídeo com suporte a HLS e DASH
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
│   ├── routes/         # Rotas da aplicação
│   ├── hooks/          # Hooks customizados
│   ├── lib/            # Bibliotecas e utilitários
│   ├── store/          # Gerenciamento de estado
│   └── context/        # Context providers
├── public/             # Arquivos estáticos
├── android/            # Projeto Android (Capacitor)
├── ios/                # Projeto iOS (Capacitor)
└── _doc/              # Documentação
```

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