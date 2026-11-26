import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function isStandalone() {
  return Boolean(window.matchMedia?.("(display-mode: standalone)").matches ||
    ("standalone" in navigator && navigator.standalone === true));
}

function usePwaState(reloadPage: () => void) {
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [standalone, setStandalone] = useState(isStandalone);
  const [installed, setInstalled] = useState(isStandalone);
  const installedRef = useRef(installed);
  const [online, setOnline] = useState(navigator.onLine);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState("");
  const [installMessage, setInstallMessage] = useState("");
  const [installing, setInstalling] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [noticeOpen, setNoticeOpen] = useState(true);
  const {
    offlineReady: [ready],
    needRefresh: [refresh],
    updateServiceWorker,
  } = useRegisterSW({
    // Each window confirms its own reload, including updates during the first visit.
    onNeedReload() {},
    onRegisteredSW(_url, registration) {
      setRegistered(registration?.active?.state === "activated");
    },
    onRegisterError() {
      setError("No se pudo preparar el modo sin conexión. Puedes seguir explorando en línea.");
    },
  });

  useEffect(() => {
    const available = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallEvent);
      setInstallMessage("");
    };
    const installedApp = () => {
      installedRef.current = true;
      setInstalled(true);
      setError("");
      setInstall(null);
      setInstallMessage("Instalación completada. Ya puedes abrir Quantify desde tus aplicaciones.");
    };
    const connection = () => setOnline(navigator.onLine);
    const display = window.matchMedia?.("(display-mode: standalone)");
    const displayChanged = () => {
      const active = isStandalone();
      setStandalone(active);
      if (active) { installedRef.current = true; setInstalled(true); setInstall(null); }
    };
    window.addEventListener("beforeinstallprompt", available);
    window.addEventListener("appinstalled", installedApp);
    window.addEventListener("online", connection);
    window.addEventListener("offline", connection);
    display?.addEventListener?.("change", displayChanged);
    return () => {
      window.removeEventListener("beforeinstallprompt", available);
      window.removeEventListener("appinstalled", installedApp);
      window.removeEventListener("online", connection);
      window.removeEventListener("offline", connection);
      display?.removeEventListener?.("change", displayChanged);
    };
  }, []);

  const canInstall = Boolean(install) && !installed;
  useEffect(() => { setNoticeOpen(true); }, [ready, refresh, canInstall, error]);

  async function installApp() {
    if (!install || installing || installed) return;
    setInstalling(true);
    setError("");
    try {
      await install.prompt();
      const choice = await install.userChoice;
      if (!installedRef.current) setInstallMessage(choice.outcome === "accepted"
        ? "Solicitud enviada al navegador. La instalación se confirmará cuando termine."
        : "Instalación aplazada. Puedes seguir explorando y volver al menú del navegador cuando quieras.");
    } catch {
      if (!installedRef.current) setError("No se pudo instalar. Prueba desde el menú de tu navegador.");
    } finally {
      setInstall(null);
      setInstalling(false);
    }
  }

  async function applyUpdate() {
    if (updating) return;
    setUpdating(true);
    setError("");
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) throw new Error("No registered worker");
      if (registration.waiting) {
        await new Promise<void>((resolve, reject) => {
          const changed = () => finish();
          const timer = setTimeout(() => finish(new Error("Activation timeout")), 8000);
          function finish(reason?: unknown) {
            clearTimeout(timer);
            navigator.serviceWorker.removeEventListener("controllerchange", changed);
            if (reason) reject(reason); else resolve();
          }
          navigator.serviceWorker.addEventListener("controllerchange", changed, { once: true });
          void updateServiceWorker(true).catch(finish);
        });
      }
      reloadPage();
    } catch {
      setError("No se pudo actualizar. Conserva tus cambios y vuelve a intentarlo.");
    } finally { setUpdating(false); }
  }

  return {
    ready, refresh, canInstall, installed, standalone, online,
    offlineAvailable: ready || registered,
    development: import.meta.env.DEV,
    supported: "serviceWorker" in navigator,
    error, installMessage, installing, updating, noticeOpen,
    installApp, applyUpdate,
    dismissNotice: () => setNoticeOpen(false),
    showNotice: () => setNoticeOpen(true),
  };
}

const PwaContext = createContext<ReturnType<typeof usePwaState> | null>(null);
export function PwaProvider({ children, reloadPage = () => location.reload() }: {
  children: ReactNode; reloadPage?: () => void;
}) {
  const value = usePwaState(reloadPage);
  return <PwaContext.Provider value={value}>{children}</PwaContext.Provider>;
}
export function usePwa() {
  const value = useContext(PwaContext);
  if (!value) throw new Error("PwaProvider is required");
  return value;
}
