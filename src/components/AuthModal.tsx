import { type Dispatch, type SetStateAction, useState } from "react";
import { Blocks, GalleryVerticalEnd } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Label } from "@/components/ui/label.tsx";
import { NDKNip07Signer, NDKNip46Signer, NDKPrivateKeySigner, type NDKSigner } from "@nostr-dev-kit/ndk";
import { useNDK, useNDKSessionLogin } from "@nostr-dev-kit/ndk-hooks";
import { generatePrivateKey, type KeyPair } from "@/helper/verify_event.ts";
import { useMutation } from "@tanstack/react-query";
import { LoggerAgent } from "@/debug.ts";
import { useClipboard } from "@/hooks/useClipboard.ts";
import { useDownload } from "@/hooks/useDownload.ts";
import { t } from "i18next";
import { DrawerBody, DrawerFooter, DrawerHeader } from "@/components/modal_v2/Drawer.tsx";

const log = LoggerAgent.create("LoginModal");


export function AuthModal() {
  const [login, setLogin] = useState<boolean>(true); // Add error state


  return (
    <>
      <DrawerHeader></DrawerHeader>
      <DrawerBody className="">

        {login ? <LoginContent setLogin={setLogin} /> :
          <Register setLogin={setLogin} />}
      </DrawerBody>
      <DrawerFooter></DrawerFooter>
    </>
  );
}

function Or() {
  return <div
    className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
    <span className="relative z-10 bg-background px-2 text-muted-foreground">Or</span>
  </div>;
}

interface AuthProps {
  setLogin: Dispatch<SetStateAction<boolean>>;
}

function LoginContent({ setLogin }: AuthProps) {
  const login = useNDKSessionLogin();
  const [nsec, setNsec] = useState<string>(""); // Initialize with empty string
  const [isLoading, setIsLoading] = useState<boolean>(false); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state
  const { ndk } = useNDK();

  const loginWithExtension = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const signer = new NDKNip07Signer();
      await login(signer, true);
    } catch (err: any) {
      setError(err.message || "Failed to login with extension.");
      log.error("Login with extension failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginNsec = async () => {
    if (!nsec) {
      setError("NSEC cannot be empty.");
      return;
    }
    setIsLoading(true);
    setError(null);
    let signer: NDKSigner;


    try {
      // Create a signer from the private key
      if (nsec.startsWith("bunker://")) {
        signer = new NDKNip46Signer(ndk!, nsec);
      } else {
        signer = new NDKPrivateKeySigner(nsec);
      }

      // Login and create a session
      await login(signer);

      // Success! User is now logged in
      log.info("Login successful");
      // Optionally close the dialog here or redirect
    } catch (err: any) {
      setError(err.message || "Login with NSEC failed.");
      log.error("Login failed:", err);
    } finally {
      setIsLoading(false);
    }
  };
  return (<>
    <div className="flex flex-col items-center gap-2">
      <a href="#" className="flex flex-col items-center gap-2 font-medium">
        <div className="flex h-8 w-8 items-center justify-center rounded-md">
          <GalleryVerticalEnd className="size-6" />
        </div>
        <span className="sr-only">{import.meta.env.VITE_APP_NAME}</span>
      </a>
      <div className="text-xl font-bold">Welcome to {import.meta.env.VITE_APP_NAME}</div>
      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <button className="underline underline-offset-4" onClick={() => setLogin(false)}>
          Sign up
        </button>
      </div>
    </div>

    <div className="flex flex-col gap-6">
      <div className="grid gap-2">
        <Label htmlFor="nsec">NSEC Private Key</Label>
        <Input
          id="nsec"
          type="password" // Use password type for NSEC for security
          placeholder="Enter your NSEC"
          value={nsec}
          onChange={(e) => setNsec(e.target.value)}
          required
          disabled={isLoading}
        />
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>
      <Button type="submit" className="w-full" onClick={handleLoginNsec} disabled={isLoading}>
        {isLoading ? "Logging in..." : "Login with NSEC"}
      </Button>
    </div>

    <Or />

    <div className=" gap-4 sm:grid-cols-2 flex  justify-center">
      {/*// O botão precisa estart centralizado no meio*/}
      <Button variant="outline" className="w-full"
              onClick={loginWithExtension} disabled={isLoading}>
        <Blocks />
        {isLoading ? "Connecting..." : "Login with Extension"}
      </Button>
    </div>
    <div
      className="text-balance text-center text-xs text-muted-foreground [&_a]:underline [&_a]:underline-offset-4 hover:[&_a]:text-primary  ">
      By clicking continue, you agree to our <a href="/terms" aria-modal={true}>Terms of Service</a>{" "}
      and <a href="/terms">Privacy Policy</a>.
    </div>
  </>);
}

function Register({ setLogin, ...props }: AuthProps) {
  const [kP, setKeyPair] = useState<KeyPair | null>(null);
  const login = useNDKSessionLogin();

  async function handleLoginWithKeyPair(keyPair: KeyPair) {
    try {
      const signer = new NDKPrivateKeySigner(keyPair.sk);
      // Login and create a session
      await login(signer);
      // Success! User is now logged in
      log.info("Login successful");
    } catch (err: any) {
      log.error("Login failed:", err);
    }
  }

  const { mutate, isPending } = useMutation({
    mutationFn: generatePrivateKey,
    mutationKey: ["generate-private-key"],
    onSuccess: (keyPair: KeyPair) => setKeyPair(keyPair)
  });

  const { copyToClipboard, isLoading: copyLoad } = useClipboard();
  const { downloadString } = useDownload();

  if (kP) {
    return <div {...props}>
      <div className="flex flex-col items-center gap-2">
        {/*Copiar chaves e baixar chaves formatadas.*/}
        <a href="#" className="flex flex-col items-center gap-2 font-medium">
          <div className="flex h-8 w-8 items-center justify-center rounded-md">
            <GalleryVerticalEnd className="size-6" />
          </div>
          <span className="sr-only">{import.meta.env.VITE_APP_NAME}</span>
        </a>
        <div className="text-xl font-bold">Your Account is Ready!</div>
        <div className="text-center text-sm">
          Please save your private key (NSEC) securely. You will need it to log in.
        </div>
        <div className="w-full max-w-md rounded-md border p-4 bg-muted">
          <Label className="mb-2 block text-center">Your NSEC Private Key</Label>
          <Input
            type="text"
            value={kP.privateKey}
            readOnly
            className="w-full font-mono"
          />
          <Button
            variant="outline"
            className="mt-2 w-full"
            disabled={copyLoad}
            onClick={() => {
              copyToClipboard(kP!.sk).catch(err => log.warn("Failed to copy NSEC to clipboard:", err));
            }}
          >
            Copy to Clipboard
          </Button>
        </div>
        <Button
          className="mt-4"
          onClick={() => downloadString("nostr-keys.txt", kP!.formated!)}>
          Download Keys as File
        </Button>

        <div className="mt-4 w-full max-w-md text-center">
          <Button onClick={() => handleLoginWithKeyPair(kP!)}>
            Login
          </Button>
        </div>
      </div>
    </div>;
  }


  return <div {...props}>
    <div className="flex flex-col items-center gap-2">
      <a href="#" className="flex flex-col items-center gap-2 font-medium">
        <div className="flex h-8 w-8 items-center justify-center rounded-md">
          <GalleryVerticalEnd className="size-6" />
        </div>
        <span className="sr-only">{import.meta.env.VITE_APP_NAME}</span>
      </a>
      <div className="text-xl font-bold">Welcome to {import.meta.env.VITE_APP_NAME}</div>
      <div className="text-center text-sm">
        You have an account?{" "}
        <button className="underline underline-offset-4" onClick={() => setLogin(true)}>
          Login
        </button>
      </div>
    </div>
    <div className=" gap-4 sm:grid-cols-2 flex  justify-center">
      {/*// O botão precisa estart centralizado no meio*/}
      <Button variant="outline" className="w-full"
              onClick={() => mutate()} disabled={isPending}
      >
        <Blocks />
        {isPending ? t("Generatin", "Generating") + "..." : t("Generate", "Generate")}
      </Button>
    </div>

  </div>;
}