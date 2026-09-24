import Header from "@/components/jangolo/Header";
import Footer from "@/components/jangolo/Footer";
import heroImg from "@/assets/jangolo-hero.jpg";
import { ShieldCheck, Truck, Heart, Users } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

const About = () => {
  const { t } = useI18n();
  const values = [
    { icon: ShieldCheck, title: t("about.v.trust"), desc: t("about.v.trust_d") },
    { icon: Truck, title: t("about.v.fast"), desc: t("about.v.fast_d") },
    { icon: Heart, title: t("about.v.local"), desc: t("about.v.local_d") },
    { icon: Users, title: t("about.v.human"), desc: t("about.v.human_d") },
  ];
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-10 md:py-16 max-w-4xl">
        <p className="text-sm text-primary font-semibold mb-2">{t("about.kicker")}</p>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-6">{t("about.title")}</h1>
        <div className="aspect-[16/9] rounded-3xl overflow-hidden shadow-warm mb-8">
          <img src={heroImg} alt="SkyRide Store" className="w-full h-full object-cover" />
        </div>
        <div className="space-y-4 text-foreground/80">
          <p className="text-lg">{t("about.p1")}</p>
          <p>{t("about.p2")}</p>
        </div>
        <div className="grid md:grid-cols-4 gap-4 mt-12">
          {values.map(v => (
            <div key={v.title} className="bg-card rounded-2xl p-5 border border-border/50 shadow-soft">
              <v.icon className="h-7 w-7 text-primary mb-3" />
              <p className="font-bold">{v.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{v.desc}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
