import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Status, StatusIndicator, StatusLabel } from "@/components/ui/shadcn-io/status";
import { t } from "i18next";

export default function OfflineDetector() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const msg = t("You_are_offline", "Você está offline");

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      toast.error(msg);
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
    <div className="fixed bottom-0 left-0 w-full flex justify-center py-3 z-50">
      <Status
        status="offline"
        variant="outline"
        className="
          border-2
          border-dashed
          border-gray-400
          bg-gray-200/60
          text-gray-800
          rounded-xl
          px-6
          py-2
          shadow
          flex
          items-center
          gap-2
        "
      >
        <StatusIndicator className="w-3 h-3" />
        <StatusLabel className="font-mono text-sm">{msg}</StatusLabel>
      </Status>
    </div>
  );
}
