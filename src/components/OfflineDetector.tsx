import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/shadcn-io/status";


export default function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      toast.error("Você está offline");
    };

    const handleOnline = () => {
      setIsOffline(false);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full bg-red-600 text-white text-center py-2 text-sm z-50 shadow-lg">
      <Status
        className="gap-4 rounded-full px-6 py-2 text-sm"
        status="offline"
        variant="outline"
      >
        <StatusIndicator />
        <StatusLabel className="font-mono">Você está offline</StatusLabel>
      </Status>

    </div>

  );
}
