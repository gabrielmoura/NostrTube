import { useState } from "react";

// A custom hook to copy text to clipboard
export function useClipboard() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const copyToClipboard = async (text: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };

  return { copyToClipboard, isLoading, error };
}