import { useEffect, useState } from "react";
import { Truck, ShieldCheck, MessageCircle, Globe } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

const TopBar = () => {
  const { t, lang, setLang } = useI18n();
  const messages = [
    { icon: Truck, key: "topbar.delivery" as const },
    { icon: ShieldCheck, key: "topbar.payment" as const },
    { icon: MessageCircle, key: "topbar.support" as const },
  ];
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((p) => (p + 1) % messages.length), 3500);
    return () => clearInterval(id);
  }, []);
  const Item = messages[i];
  const Icon = Item.icon;
  return (
    <div className="bg-foreground text-background py-2 text-xs">
      <div className="container flex items-center justify-between gap-2">
        <div className="flex-1 flex items-center justify-center gap-2">
          <Icon className="h-3.5 w-3.5 text-accent" />
          <span className="font-medium truncate">{t(Item.key)}</span>
        </div>
        <button
          onClick={() => setLang(lang === "fr" ? "en" : "fr")}
          className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-md hover:bg-background/10 font-bold uppercase"
          aria-label={t("lang.label")}
        >
          <Globe className="h-3 w-3" />
          {lang === "fr" ? "FR" : "EN"}
        </button>
      </div>
    </div>
  );
};

export default TopBar;
