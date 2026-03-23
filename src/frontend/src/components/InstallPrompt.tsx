import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Expose the deferred prompt globally so it can be triggered from anywhere
let globalDeferredPrompt: BeforeInstallPromptEvent | null = null;
export function getInstallPrompt() {
  return globalDeferredPrompt;
}

export function isInstalled() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true
  );
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem("pwa-install-dismissed") === "true",
  );
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    // Already installed — don't show banner
    if (isInstalled()) {
      setStandalone(true);
      return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      globalDeferredPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (standalone || !deferredPrompt || dismissed) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") {
      globalDeferredPrompt = null;
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-install-dismissed", "true");
    setDismissed(true);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-3 bg-blue-700 px-4 py-3 text-white shadow-lg"
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
    >
      <div className="flex-1">
        <p className="text-sm font-semibold">Install TuitionManager</p>
        <p className="text-xs text-blue-200">
          Add to your home screen for quick access
        </p>
      </div>
      <button
        type="button"
        onClick={handleInstall}
        className="rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-blue-700 hover:bg-blue-50 active:scale-95 transition-transform"
      >
        Install
      </button>
      <button
        type="button"
        onClick={handleDismiss}
        className="text-blue-200 hover:text-white text-lg leading-none px-1"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
