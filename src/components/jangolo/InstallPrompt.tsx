import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Download, X, Share, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const isStandalone = () =>
  window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone === true;

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.userAgent.includes("Macintosh") && navigator.maxTouchPoints > 1);

/**
 * Propose l'installation de l'app à CHAQUE visite tant qu'elle n'est pas installée.
 * "Plus tard" masque le bandeau uniquement pour la page en cours : il revient à la visite suivante.
 */
const InstallPrompt = () => {
  const { pathname } = useLocation();
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) { setInstalled(true); return; }
    const onBip = (e: Event) => { e.preventDefault(); setDeferred(e as BIPEvent); };
    const onInstalled = () => { setInstalled(true); setDeferred(null); };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const ios = typeof navigator !== "undefined" && isIOS();
  const canPrompt = !!deferred || ios;

  if (installed || hidden || !canPrompt) return null;
  // On ne gêne ni l'admin ni le tunnel d'achat
  if (pathname.startsWith("/admin") || pathname.startsWith("/checkout")) return null;

  const install = async () => {
    if (deferred) {
      await deferred.prompt();
      const { outcome } = await deferred.userChoice;
      setDeferred(null);
      if (outcome === "accepted") setInstalled(true);
      else setHidden(true);
    } else if (ios) {
      setShowIosHelp(true);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Installer l'application SkyRide Store"
      className="fixed z-[60] left-3 right-3 bottom-36 md:bottom-4 md:right-auto md:max-w-sm rounded-2xl border border-border bg-card shadow-warm p-4"
    >
      <button
        onClick={() => setHidden(true)}
        aria-label="Plus tard"
        className="absolute top-2 right-2 h-7 w-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-6">
        <img src="/icon-192.png" alt="" className="h-12 w-12 rounded-xl shrink-0" />
        <div className="min-w-0">
          <p className="font-bold text-sm">Installez SkyRide Store</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Accès rapide depuis votre écran d'accueil, même avec une connexion faible.
          </p>
        </div>
      </div>

      {showIosHelp ? (
        <div className="mt-3 text-xs text-foreground/80 space-y-1.5 bg-muted rounded-lg p-3">
          <p className="flex items-center gap-1.5">1. Touchez <Share className="h-3.5 w-3.5 inline" /> <strong>Partager</strong> dans Safari</p>
          <p className="flex items-center gap-1.5">2. Choisissez <PlusSquare className="h-3.5 w-3.5 inline" /> <strong>Sur l'écran d'accueil</strong></p>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <Button size="sm" className="flex-1 bg-gradient-cta font-semibold" onClick={install}>
            <Download className="h-4 w-4 mr-1.5" /> Installer l'app
          </Button>
          <Button size="sm" variant="outline" onClick={() => setHidden(true)}>Plus tard</Button>
        </div>
      )}
    </div>
  );
};

export default InstallPrompt;
