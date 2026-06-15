import { NDKNip07Signer, NDKNip46Signer, NDKPrivateKeySigner, type NDKSigner } from '@nostr-dev-kit/ndk'
import { useNDK, useNDKSessionLogin } from '@nostr-dev-kit/ndk-hooks'
import { useMutation } from '@tanstack/react-query'
import { t } from 'i18next'
import {
  AlertTriangle,
  Blocks,
  GalleryVerticalEnd,
  KeyRound,
  PlugZap,
  Server,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { type Dispatch, type FormEvent, type SetStateAction, useState } from 'react'
import { DrawerBody, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/modal_v2/Drawer.tsx'
import { modal } from '@/components/modal_v2/modal-manager.ts'
import { Button } from '@/components/ui/button.tsx'
import { Input } from '@/components/ui/input.tsx'
import { Label } from '@/components/ui/label.tsx'
import { generatePrivateKey, type KeyPair } from '@/helper/verify_event.ts'
import { useClipboard } from '@/hooks/useClipboard.ts'
import { useDownload } from '@/hooks/useDownload.ts'
import { LoggerAgent } from '@/lib/debug.ts'

const log = LoggerAgent.create('LoginModal')
type LoginMethod = 'extension' | 'nsec' | 'bunker'

export function AuthModal() {
  const [login, setLogin] = useState(true)

  return (
    <>
      <DrawerHeader className="border-b pb-4 text-left">
        <DrawerTitle className="flex items-center gap-3 text-xl font-semibold tracking-tight">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <GalleryVerticalEnd className="size-5" />
          </div>
          Entrar no {import.meta.env.VITE_APP_NAME}
        </DrawerTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          Use sua extensão Nostr, conecte via bunker ou entre com `nsec` quando estiver em um ambiente confiável.
        </p>
      </DrawerHeader>
      <DrawerBody className="space-y-6 pt-5">
        {login ? <LoginContent setLogin={setLogin} /> : <Register setLogin={setLogin} />}
      </DrawerBody>
      <DrawerFooter className="border-t pt-4 text-xs text-muted-foreground">
        Suas chaves continuam sob seu controle. Evite colar `nsec` em máquinas que você não confia.
      </DrawerFooter>
    </>
  )
}

interface AuthProps {
  setLogin: Dispatch<SetStateAction<boolean>>
}

interface LoginMethodCardProps {
  active: boolean
  title: string
  description: string
  icon: typeof ShieldCheck
  onSelect: () => void
}

function LoginMethodCard({ active, title, description, icon: Icon, onSelect }: LoginMethodCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`rounded-2xl border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 ${
        active
          ? 'border-primary/50 bg-primary/10 text-foreground'
          : 'border-border bg-card/70 text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={
            active ? 'rounded-xl bg-primary/15 p-2 text-primary' : 'rounded-xl bg-secondary p-2 text-muted-foreground'
          }
        >
          <Icon className="size-4" />
        </div>
        <div className="space-y-1">
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-sm leading-relaxed">{description}</p>
        </div>
      </div>
    </button>
  )
}

function LoginContent({ setLogin }: AuthProps) {
  const login = useNDKSessionLogin()
  const [method, setMethod] = useState<LoginMethod>('extension')
  const [credential, setCredential] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { ndk } = useNDK()

  const loginWithExtension = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const signer = new NDKNip07Signer()
      await login(signer, true)
      modal.dismissAll()
    } catch (err: any) {
      setError(err.message || 'Falha ao conectar com a extensão.')
      log.error('Login with extension failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCredentialLogin = async (event: FormEvent) => {
    event.preventDefault()
    const value = credential.trim()

    if (!value) {
      setError(method === 'bunker' ? 'Informe uma URL bunker://.' : 'NSEC não pode estar vazio.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let signer: NDKSigner
      if (method === 'bunker') {
        if (!value.startsWith('bunker://')) {
          setError('A conexão bunker precisa começar com bunker://.')
          return
        }
        signer = new NDKNip46Signer(ndk!, value)
      } else {
        if (!value.startsWith('nsec')) {
          setError('Informe uma chave privada no formato nsec.')
          return
        }
        signer = new NDKPrivateKeySigner(value)
      }

      await login(signer)
      modal.dismissAll()
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar com a chave fornecida.')
      log.error('Login failed:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 text-primary" />
          <div>
            <p className="font-medium">Entrada recomendada</p>
            <p className="text-sm text-muted-foreground">
              A extensão Nostr mantém sua chave privada fora da página e é o método mais seguro.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3">
        <LoginMethodCard
          active={method === 'extension'}
          title="Extensão Nostr"
          description="Conecta via NIP-07 sem colar chave privada."
          icon={PlugZap}
          onSelect={() => {
            setMethod('extension')
            setError(null)
          }}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <LoginMethodCard
            active={method === 'bunker'}
            title="Bunker"
            description="Usa NIP-46 para assinar remotamente."
            icon={Server}
            onSelect={() => {
              setMethod('bunker')
              setCredential('')
              setError(null)
            }}
          />
          <LoginMethodCard
            active={method === 'nsec'}
            title="NSEC"
            description="Entrada manual com chave privada."
            icon={KeyRound}
            onSelect={() => {
              setMethod('nsec')
              setCredential('')
              setError(null)
            }}
          />
        </div>
      </div>

      {method === 'extension' ? (
        <div className="space-y-3">
          <Button
            variant="gradient"
            className="w-full"
            onClick={loginWithExtension}
            disabled={isLoading}
            isLoading={isLoading}
          >
            <Blocks className="size-4" />
            Entrar com extensão
          </Button>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleCredentialLogin}>
          {method === 'nsec' ? (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 size-4" />
                <p>
                  Use `nsec` apenas em um dispositivo privado. Quem tiver essa chave pode controlar sua identidade
                  Nostr.
                </p>
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="login-credential">{method === 'bunker' ? 'URL bunker' : 'Chave nsec'}</Label>
            <Input
              id="login-credential"
              type="password"
              placeholder={method === 'bunker' ? 'bunker://...' : 'nsec1...'}
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              disabled={isLoading}
              autoComplete="current-password"
              aria-describedby="auth-credential-help"
            />
            <p id="auth-credential-help" className="text-xs text-muted-foreground">
              {method === 'bunker'
                ? 'Cole a URL fornecida pelo seu signer remoto NIP-46.'
                : 'A chave é usada localmente para criar o signer desta sessão.'}
            </p>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading} isLoading={isLoading}>
            <KeyRound className="size-4" />
            {method === 'bunker' ? 'Entrar com bunker' : 'Entrar com nsec'}
          </Button>
        </form>
      )}

      <div className="rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
        Ainda não tem identidade?
        <button
          className="ml-1 font-medium text-foreground underline underline-offset-4"
          onClick={() => setLogin(false)}
        >
          Gerar uma agora
        </button>
      </div>
    </div>
  )
}

function Register({ setLogin }: AuthProps) {
  const [kP, setKeyPair] = useState<KeyPair | null>(null)
  const [error, setError] = useState<string | null>(null)
  const login = useNDKSessionLogin()

  async function handleLoginWithKeyPair(keyPair: KeyPair) {
    try {
      const signer = new NDKPrivateKeySigner(keyPair.sk)
      await login(signer)
      modal.dismissAll()
    } catch (err: any) {
      setError(err.message || 'Falha ao entrar com a chave gerada.')
      log.error('Login failed:', err)
    }
  }

  const { mutate, isPending } = useMutation({
    mutationFn: generatePrivateKey,
    mutationKey: ['generate-private-key'],
    onSuccess: (keyPair: KeyPair) => {
      setError(null)
      setKeyPair(keyPair)
    },
    onError: (err: any) => {
      setError(err.message || 'Falha ao gerar a chave.')
    },
  })

  const { copyToClipboard, isLoading: copyLoad } = useClipboard()
  const { downloadString } = useDownload()

  if (kP) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Sparkles className="size-5 text-primary" />
            <div>
              <p className="font-medium">Sua identidade foi criada</p>
              <p className="text-sm text-muted-foreground">
                Salve sua chave privada antes de continuar. Sem ela, você perde acesso à conta.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="generated-nsec">Sua NSEC</Label>
          <Input id="generated-nsec" type="text" value={kP.privateKey} readOnly className="font-mono" />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            variant="outline"
            disabled={copyLoad}
            onClick={() => copyToClipboard(kP.sk).catch((err) => log.warn('Failed to copy NSEC to clipboard:', err))}
          >
            Copiar chave
          </Button>
          <Button onClick={() => downloadString('nostr-keys.txt', kP.formated!)}>Baixar arquivo</Button>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button className="w-full" onClick={() => handleLoginWithKeyPair(kP)}>
          Entrar com esta identidade
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <p className="font-medium">Criação rápida</p>
        <p className="text-sm text-muted-foreground">
          Gere uma nova identidade Nostr localmente e entre imediatamente depois de salvar a chave.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button variant="outline" className="w-full" onClick={() => mutate()} disabled={isPending} isLoading={isPending}>
        <Blocks className="size-4" />
        {isPending ? t('Generatin', 'Generating') + '...' : 'Gerar identidade'}
      </Button>

      <div className="rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
        Já tem uma identidade?
        <button
          className="ml-1 font-medium text-foreground underline underline-offset-4"
          onClick={() => setLogin(true)}
        >
          Voltar para login
        </button>
      </div>
    </div>
  )
}
