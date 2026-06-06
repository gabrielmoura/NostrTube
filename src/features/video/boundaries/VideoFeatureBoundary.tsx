import type { ReactNode } from "react";
import { ErrorBoundaryVideo } from "@/routes/v/@components/error";

interface VideoFeatureBoundaryProps {
  children: ReactNode;
}

export function VideoFeatureBoundary({ children }: VideoFeatureBoundaryProps) {
  return <ErrorBoundaryVideo>{children}</ErrorBoundaryVideo>;
}
