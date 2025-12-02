import { useEffect, useState } from "react";
import { AlertCircle, Bell, Loader2, MapPin, Shield } from "lucide-react";
import ngeohash from "ngeohash";
import { Card, CardHeader, Switch } from "./CommonComponents";
import { LoggerAgent } from "@/debug.ts";
import useUserStore from "@/store/useUserStore.ts";

export const PermissionSettings = () => {
  const log = LoggerAgent.create("PermissionSettings");
  const setGeoHash = useUserStore((state) => state.setGeoHash);
  const setPushNotificationsEnabled = useUserStore((state) => state.setPushNotificationsEnabled);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(false);

  // Estados para dados e feedback
  const [currentGeohash, setCurrentGeohash] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null); // 'location' | 'push' | null
  const [error, setError] = useState<string | null>(null);

  // Verifica o status inicial das permissões ao montar o componente
  useEffect(() => {
    // Verificar Permissão de Notificação
    if ("Notification" in window && Notification.permission === "granted") {
      setPushEnabled(true);
    }

    // Verificar Permissão de Geolocalização (Opcional: navegadores modernos não expõem "granted" facilmente sem pedir,
    // então mantemos false até o usuário interagir ou persistimos isso no localStorage/Store)
  }, []);

  /**
   * Lida com a solicitação de Notificações Push
   */
  const handlePush = async (checked: boolean) => {
    setError(null);

    if (!checked) {
      // Se estiver desativando, apenas muda o estado visual (lógica real de desinscrição do Service Worker iria aqui)
      setPushEnabled(false);
      return;
    }

    setLoading("push");

    try {
      if (!("Notification" in window)) {
        throw new Error("Este navegador não suporta notificações.");
      }

      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        setPushEnabled(true);
        // TODO: Registrar o Service Worker que enviaria a subscription para o backend
      } else {
        setPushEnabled(false);
        throw new Error("Permissão de notificação negada.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao ativar notificações");
      setPushEnabled(false);
      log.error("Erro ao solicitar permissão de notificação:", err);
    } finally {
      setLoading(null);
    }
  };

  /**
   * Lida com a Geolocalização e geração do Geohash
   */
  const handleLocation = (checked: boolean) => {
    setError(null);

    if (!checked) {
      setLocationEnabled(false);
      setCurrentGeohash(null);
      return;
    }

    setLoading("location");

    if (!("geolocation" in navigator)) {
      setError("Geolocalização não é suportada neste navegador.");
      setLoading(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        // Gera o Geohash com precisão de 7 caracteres (aprox. 150m de margem)
        const hash = ngeohash.encode(latitude, longitude, 7);

        setCurrentGeohash(hash);
        setGeoHash(hash);
        setLocationEnabled(true);
        setPushNotificationsEnabled(true);
        setLoading(null);
      },
      (err) => {
        log.error("Erro ao obter localização:", err);
        let msg = "Erro ao obter localização.";
        if (err.code === 1) msg = "Permissão de localização negada.";
        if (err.code === 2) msg = "Posição indisponível.";
        if (err.code === 3) msg = "Tempo limite esgotado.";

        setError(msg);
        setLocationEnabled(false);
        setPushNotificationsEnabled(false);
        setLoading(null);
      },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  };

  //

  return (
    <Card>
      <CardHeader
        title="Privacidade e Notificações"
        icon={Shield}
      />

      {/* Exibição de Erros Globais */}
      {error && (
        <div
          className="mx-4 mt-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-md flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">

        {/* Seção Notificações Push */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              {loading === "push" ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Notificações Push</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {pushEnabled ? "Notificações ativas" : "Receba alertas sobre novos vídeos e lives."}
              </p>
            </div>
          </div>
          <Switch
            checked={pushEnabled}
            onCheckedChange={handlePush}
            disabled={loading === "push"}
          />
        </div>

        {/* Seção Geohash Local */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-start gap-3">
            <div
              className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
              {loading === "location" ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
            </div>
            <div>
              <p className="font-medium text-zinc-900 dark:text-zinc-100">Geohash Local</p>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Melhore a descoberta de conteúdo regional.
              </p>

              {/* Exibe o Geohash gerado se disponível */}
              {currentGeohash && locationEnabled && (
                <div
                  className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                  Hash: {currentGeohash}
                </div>
              )}
            </div>
          </div>
          <Switch
            checked={locationEnabled}
            onCheckedChange={handleLocation}
            disabled={loading === "location"}
          />
        </div>

      </div>
    </Card>
  );
};