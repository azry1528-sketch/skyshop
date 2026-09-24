import { Clock, Flame, Lock, Sparkles, Zap } from "lucide-react";

const LABEL_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  "Prévente exclusive":     { bg: "bg-primary",      text: "text-primary-foreground",    icon: Sparkles },
  "Arrivage en cours":      { bg: "bg-secondary",     text: "text-secondary-foreground",  icon: Zap },
  "Réservation ouverte":    { bg: "bg-accent",        text: "text-accent-foreground",     icon: Lock },
  "Livraison du prochain lot": { bg: "bg-foreground", text: "text-background",            icon: Clock },
  "Stock limité":           { bg: "bg-destructive",   text: "text-destructive-foreground",icon: Flame },
  "Édition limitée":        { bg: "bg-gradient-cta",  text: "text-primary-foreground",    icon: Sparkles },
};

const PreorderBadge = ({ label }: { label: string }) => {
  const style = LABEL_STYLES[label] || LABEL_STYLES["Prévente exclusive"];
  const Icon = style.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${style.bg} ${style.text}`}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
};

export default PreorderBadge;
