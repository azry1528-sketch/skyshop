import { Link } from "react-router-dom";
import { ShieldCheck, Truck, MessageCircle, Phone, Mail, MapPin, Facebook, Instagram, Youtube, Music2 } from "lucide-react";
import { CATEGORY_TREE, BRAND, SOCIALS } from "@/lib/jangolo";
import { useI18n } from "@/contexts/I18nContext";

const Footer = () => {
  const { t } = useI18n();
  return (
    <footer className="bg-foreground text-background mt-20">
      <div className="container py-12 grid gap-10 md:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-cta flex items-center justify-center font-extrabold">S</div>
            <span className="text-xl font-extrabold">{BRAND}</span>
          </div>
          <p className="text-sm text-background/70 leading-relaxed">{t("footer.tagline")}</p>
          <div className="flex gap-2 mt-4">
            <a href={SOCIALS.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="h-9 w-9 rounded-full bg-background/10 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-smooth"><Facebook className="h-4 w-4" /></a>
            <a href={SOCIALS.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="h-9 w-9 rounded-full bg-background/10 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-smooth"><Instagram className="h-4 w-4" /></a>
            <a href={SOCIALS.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok" className="h-9 w-9 rounded-full bg-background/10 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-smooth"><Music2 className="h-4 w-4" /></a>
            <a href={SOCIALS.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="h-9 w-9 rounded-full bg-background/10 hover:bg-accent hover:text-accent-foreground flex items-center justify-center transition-smooth"><Youtube className="h-4 w-4" /></a>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-accent">{t("footer.cats")}</h4>
          <ul className="space-y-2 text-sm text-background/80">
            {CATEGORY_TREE.map((c) => (
              <li key={c.slug}><Link to={`/category/${c.slug}`} className="hover:text-accent">{c.label}</Link></li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-accent">{t("footer.trust")}</h4>
          <ul className="space-y-2 text-sm text-background/80">
            <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> {t("trust.secure")}</li>
            <li className="flex items-center gap-2"><Truck className="h-4 w-4" /> {t("trust.fast")}</li>
            <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4" /> {t("trust.support")}</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-3 text-accent">{t("footer.contact")}</h4>
          <ul className="space-y-2 text-sm text-background/80">
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +33 1 23 45 67 89</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> bonjour@skyridestore.fr</li>
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {t("footer.cities")}</li>
            <li>
              <Link to="/suivi" className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 rounded-full bg-accent text-accent-foreground text-xs font-semibold hover:opacity-90">
                📦 {t("nav.track")}
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-background/10">
        <div className="container py-4 flex flex-col md:flex-row items-center justify-between text-xs text-background/60 gap-2">
          <p>© {new Date().getFullYear()} {BRAND}. {t("footer.copyright")}</p>
          <div className="flex gap-4">
            <Link to="/privacy-policy" className="hover:text-accent">{t("footer.privacy")}</Link>
            <Link to="/terms-of-service" className="hover:text-accent">{t("footer.terms")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
