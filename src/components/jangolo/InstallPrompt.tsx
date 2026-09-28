import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Download, X, Share, PlusSquare, MoreHorizontal, ArrowDown } from "lucide-react";
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


  // iOS : Apple interdit l'installation en un clic (pas de beforeinstallprompt).
  // On affiche donc un guide visuel qui pointe directement vers le bouton de Safari.
  if (showIosHelp) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/70 flex flex-col justify-end" onClick={() => setShowIosHelp(false)}>
        <div className="bg-card rounded-t-3xl p-5 pb-8 shadow-warm" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center gap-3 mb-4">
            <img src="/icon-192.png" alt="" className="h-12 w-12 rounded-xl" />
            <div className="flex-1">
              <p className="font-bold">Installer SkyRide Store</p>
              <p className="text-xs text-muted-foreground">3 touches, 5 secondes</p>
            </div>
            <button onClick={() => setShowIosHelp(false)} aria-label="Fermer" className="h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center">
              <X className="h-4 w-4" />
            </button>
          </div>
          <ol className="space-y-3 text-sm">
            <li className="flex items-center gap-3 bg-muted rounded-xl p-3">
              <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">1</span>
              <span>Touchez <MoreHorizontal className="inline h-4 w-4 mx-0.5" /> ou <Share className="inline h-4 w-4 mx-0.5" /> en bas de Safari</span>
            </li>
            <li className="flex items-center gap-3 bg-muted rounded-xl p-3">
              <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">2</span>
              <span>Choisissez <strong>Partager</strong> si le menu s'ouvre</span>
            </li>
            <li className="flex items-center gap-3 bg-muted rounded-xl p-3">
              <span className="h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold shrink-0">3</span>
              <span>Puis <PlusSquare className="inline h-4 w-4 mx-0.5" /> <strong>Sur l'écran d'accueil</strong> → <strong>Ajouter</strong></span>
            </li>
          </ol>
          <div className="mt-4 flex flex-col items-center text-primary animate-bounce">
            <ArrowDown className="h-7 w-7" />
            <span className="text-xs font-semibold">Les boutons de Safari sont juste en dessous</span>
          </div>
        </div>
      </div>
    );
  }

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

      <div className="mt-3 flex gap-2">
        <Button size="sm" className="flex-1 bg-gradient-cta font-semibold" onClick={install}>
          <Download className="h-4 w-4 mr-1.5" /> Installer l'app
        </Button>
        <Button size="sm" variant="outline" onClick={() => setHidden(true)}>Plus tard</Button>
      </div>
    </div>
  );
};

export default InstallPrompt;
