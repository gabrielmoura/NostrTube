import { Blocks, GalleryVerticalEnd } from "lucide-react";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Button } from "@/components/ui/button.tsx";
import React, { useState } from "react";
import { useNDKSessionLogin } from "@nostr-dev-kit/ndk-hooks";
import { NDKNip07Signer, NDKPrivateKeySigner } from "@nostr-dev-kit/ndk";
import { cn } from "@/helper/format.ts";

export default function AuthModal({ className, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const [login, setLogin] = useState<boolean>(false); // Add error state
  if (login) {
    return <Login setLogin={setLogin} className={className} {...props} />;
  }
  return <Register />;
}

function Register({ className, ...props }: AuthProps) {
  return <div className={cn("flex flex-col gap-6", className)} {...props}>
    Register
  </div>;
}

interface AuthProps extends React.ComponentPropsWithoutRef<"div"> {
  setLogin?: React.Dispatch<React.SetStateAction<boolean>>;
}

function Login({ setLogin, className, ...props }: AuthProps | undefined) {
  const login = useNDKSessionLogin();
  const [nsec, setNsec] = useState<string>(""); // Initialize with empty string
  const [isLoading, setIsLoading] = useState<boolean>(false); // Add loading state
  const [error, setError] = useState<string | null>(null); // Add error state

  const loginWithExtension = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const signer = new NDKNip07Signer();
      await login(signer, true);
    } catch (err: any) {
      setError(err.message || "Failed to login with extension.");
      console.error("Login with extension failed:", err);
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
    try {
      // Create a signer from the private key
      const signer = new NDKPrivateKeySigner(nsec);

      // Login and create a session
      await login(signer);

      // Success! User is now logged in
      console.log("Login successful");
      // Optionally close the dialog here or redirect
    } catch (err: any) {
      setError(err.message || "Login with NSEC failed.");
      console.error("Login failed:", err);
    } finally {
      setIsLoading(false);
    }
  };
  return <div className={cn("flex flex-col gap-6", className)} {...props}>
    <div className="flex flex-col items-center gap-2">
      <a href="#" className="flex flex-col items-center gap-2 font-medium">
        <div className="flex h-8 w-8 items-center justify-center rounded-md">
          <GalleryVerticalEnd className="size-6" />
        </div>
        <span className="sr-only">{import.meta.env.VITE_APP_NAME}</span>
      </a>
      <DialogTitle className="text-xl font-bold">Welcome to {import.meta.env.VITE_APP_NAME}</DialogTitle>
      <DialogDescription className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <button href="#" className="underline underline-offset-4" onClick={()=>setLogin(false)}>
          Sign up
        </button>
      </DialogDescription>
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

    <div
      className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
      <span className="relative z-10 bg-background px-2 text-muted-foreground">Or</span>
    </div>


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
      By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
      and <a href="#">Privacy Policy</a>.
    </div>
  </div>;
}