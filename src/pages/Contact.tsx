import Header from "@/components/jangolo/Header";
import Footer from "@/components/jangolo/Footer";
import { Mail, Phone, MapPin } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

const Contact = () => {
  const { t } = useI18n();
  const items = [
    { icon: Phone, label: t("contact.phone_label"), value: "+33 1 23 45 67 89" },
    { icon: Mail, label: t("contact.email_label"), value: "bonjour@skyridestore.fr" },
    { icon: MapPin, label: t("contact.offices_label"), value: "Paris · Lyon" },
  ];
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-10 md:py-16 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-2">{t("contact.title")}</h1>
        <p className="text-muted-foreground mb-8">{t("contact.subtitle")}</p>

        <a
          href="mailto:bonjour@skyridestore.fr"
          className="block bg-gradient-cta text-primary-foreground rounded-3xl p-8 shadow-warm hover:opacity-95 transition-smooth"
        >
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-background/20 flex items-center justify-center">
              <Mail className="h-8 w-8" />
            </div>
            <div>
              <p className="text-sm opacity-90">{t("contact.fast_label")}</p>
              <p className="text-2xl font-extrabold">{t("contact.email_label")}</p>
              <p className="text-sm opacity-90 mt-1">bonjour@skyridestore.fr</p>
            </div>
          </div>
        </a>

        <div className="grid md:grid-cols-3 gap-4 mt-6">
          {items.map(c => (
            <div key={c.label} className="bg-card rounded-2xl p-5 border border-border/50 shadow-soft">
              <c.icon className="h-5 w-5 text-primary mb-2" />
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="font-semibold mt-1">{c.value}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
