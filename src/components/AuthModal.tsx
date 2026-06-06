import { type Dispatch, type FormEvent, type SetStateAction, useState } from "react";
import { Blocks, GalleryVerticalEnd, KeyRound, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { NDKNip07Signer, NDKNip46Signer, NDKPrivateKeySigner, type NDKSigner } from "@nostr-dev-kit/ndk";
import { useNDK, useNDKSessionLogin } from "@nostr-dev-kit/ndk-hooks";
import { generatePrivateKey, type KeyPair } from "@/helper/verify_event.ts";
import { useMutation } from "@tanstack/react-query";
import { LoggerAgent } from "@/lib/debug.ts";
import { useClipboard } from "@/hooks/useClipboard.ts";
import { useDownload } from "@/hooks/useDownload.ts";
import { t } from "i18next";
import { DrawerBody, DrawerFooter, DrawerHeader, DrawerTitle } from "@/components/modal_v2/Drawer.tsx";
import { modal } from "@/components/modal_v2/modal-manager.ts";

const log = LoggerAgent.create("LoginModal");

export function AuthModal() {
  const [login, setLogin] = useState(true);

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
          Use sua extensão Nostr, um `nsec` ou gere uma identidade nova sem sair da interface.
        </p>
      </DrawerHeader>
      <DrawerBody className="space-y-6 pt-5">
        {login ? <LoginContent setLogin={setLogin} /> : <Register setLogin={setLogin} />}
      </DrawerBody>
      <DrawerFooter className="border-t pt-4 text-xs text-muted-foreground">
        Suas chaves continuam sob seu controle. Evite colar `nsec` em máquinas que você não confia.
      </DrawerFooter>
    </>
  );
}

function SectionDivider() {
  return (
    <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
      <span className="relative z-10 bg-background px-2 text-muted-foreground">Ou continue com</span>
    </div>
  );
}

interface AuthProps {
  setLogin: Dispatch<SetStateAction<boolean>>;
}

function LoginContent({ setLogin }: AuthProps) {
  const login = useNDKSessionLogin();
  const [nsec, setNsec] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { ndk } = useNDK();

  const loginWithExtension = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const signer = new NDKNip07Signer();
      await login(signer, true);
      modal.dismissAll();
    } catch (err: any) {
      setError(err.message || "Falha ao conectar com a extensão.");
      log.error("Login with extension failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginNsec = async (event: FormEvent) => {
    event.preventDefault();
    if (!nsec.trim()) {
      setError("NSEC não pode estar vazio.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let signer: NDKSigner;
      if (nsec.startsWith("bunker://")) {
        signer = new NDKNip46Signer(ndk!, nsec);
      } else {
        signer = new NDKPrivateKeySigner(nsec);
      }

      await login(signer);
      modal.dismissAll();
    } catch (err: any) {
      setError(err.message || "Falha ao autenticar com a chave fornecida.");
      log.error("Login failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 size-5 text-primary" />
          <div>
            <p className="font-medium">Entrada recomendada</p>
            <p className="text-sm text-muted-foreground">Prefira sua extensão Nostr para não expor a chave privada diretamente na interface.</p>
          </div>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleLoginNsec}>
        <div className="space-y-2">
          <Label htmlFor="nsec">NSEC ou bunker</Label>
          <Input
            id="nsec"
            type="password"
            placeholder="nsec1... ou bunker://..."
            value={nsec}
            onChange={(e) => setNsec(e.target.value)}
            disabled={isLoading}
            autoComplete="current-password"
            aria-describedby="auth-nsec-help"
          />
          <p id="auth-nsec-help" className="text-xs text-muted-foreground">
            Você pode colar um `nsec` ou uma URL `bunker://` para NIP-46.
          </p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <Button type="submit" className="w-full" disabled={isLoading} isLoading={isLoading}>
          <KeyRound className="size-4" />
          Entrar com chave
        </Button>
      </form>

      <SectionDivider />

      <Button variant="outline" className="w-full" onClick={loginWithExtension} disabled={isLoading} isLoading={isLoading}>
        <Blocks className="size-4" />
        Entrar com extensão
      </Button>

      <div className="rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
        Ainda não tem identidade?
        <button className="ml-1 font-medium text-foreground underline underline-offset-4" onClick={() => setLogin(false)}>
          Gerar uma agora
        </button>
      </div>
    </div>
  );
}

function Register({ setLogin }: AuthProps) {
  const [kP, setKeyPair] = useState<KeyPair | null>(null);
  const [error, setError] = useState<string | null>(null);
  const login = useNDKSessionLogin();

  async function handleLoginWithKeyPair(keyPair: KeyPair) {
    try {
      const signer = new NDKPrivateKeySigner(keyPair.sk);
      await login(signer);
      modal.dismissAll();
    } catch (err: any) {
      setError(err.message || "Falha ao entrar com a chave gerada.");
      log.error("Login failed:", err);
    }
  }

  const { mutate, isPending } = useMutation({
    mutationFn: generatePrivateKey,
    mutationKey: ["generate-private-key"],
    onSuccess: (keyPair: KeyPair) => {
      setError(null);
      setKeyPair(keyPair);
    },
    onError: (err: any) => {
      setError(err.message || "Falha ao gerar a chave.");
    }
  });

  const { copyToClipboard, isLoading: copyLoad } = useClipboard();
  const { downloadString } = useDownload();

  if (kP) {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Sparkles className="size-5 text-primary" />
            <div>
              <p className="font-medium">Sua identidade foi criada</p>
              <p className="text-sm text-muted-foreground">Salve sua chave privada antes de continuar. Sem ela, você perde acesso à conta.</p>
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
            onClick={() => copyToClipboard(kP.sk).catch((err) => log.warn("Failed to copy NSEC to clipboard:", err))}
          >
            Copiar chave
          </Button>
          <Button onClick={() => downloadString("nostr-keys.txt", kP.formated!)}>Baixar arquivo</Button>
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button className="w-full" onClick={() => handleLoginWithKeyPair(kP)}>
          Entrar com esta identidade
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card p-4 shadow-sm">
        <p className="font-medium">Criação rápida</p>
        <p className="text-sm text-muted-foreground">Gere uma nova identidade Nostr localmente e entre imediatamente depois de salvar a chave.</p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Button variant="outline" className="w-full" onClick={() => mutate()} disabled={isPending} isLoading={isPending}>
        <Blocks className="size-4" />
        {isPending ? t("Generatin", "Generating") + "..." : "Gerar identidade"}
      </Button>

      <div className="rounded-2xl border bg-secondary/40 p-4 text-sm text-muted-foreground">
        Já tem uma identidade?
        <button className="ml-1 font-medium text-foreground underline underline-offset-4" onClick={() => setLogin(true)}>
          Voltar para login
        </button>
      </div>
    </div>
  );
}
