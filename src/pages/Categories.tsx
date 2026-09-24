import { Link } from "react-router-dom";
import Header from "@/components/jangolo/Header";
import Footer from "@/components/jangolo/Footer";
import { CATEGORY_TREE as CATEGORIES } from "@/lib/jangolo";
import { useI18n } from "@/contexts/I18nContext";
import { ArrowRight } from "lucide-react";

const CAT_BG: Record<string, string> = {
  "trottinettes-electriques": "https://images.unsplash.com/photo-1604868189265-219ba7a3c6a5?w=600&q=60",
  "surron-motos-electriques": "https://images.unsplash.com/photo-1622185135505-2d795003994a?w=600&q=60",
  "accessoires-mobilite": "https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=600&q=60",
};

const CAT_COLORS = [
  "from-primary/80 to-secondary/90",
  "from-blue-600/80 to-blue-900/80",
  "from-purple-600/80 to-purple-900/80",
  "from-green-600/80 to-green-900/80",
];

const Categories = () => {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 md:py-12">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-2">{t("cats.title")}</h1>
        <p className="text-muted-foreground mb-8">{t("cats.subtitle")}</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
          {CATEGORIES.map((c, i) => {
            const bg = CAT_BG[c.slug];
            return (
              <Link
                key={c.slug}
                to={`/category/${c.slug}`}
                className="group aspect-[4/5] rounded-3xl overflow-hidden relative border border-border/50 hover:shadow-warm transition-smooth"
              >
                {/* Image de fond flouée */}
                {bg && (
                  <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{ backgroundImage: `url(${bg})`, filter: "blur(2px)", transform: "scale(1.05)" }}
                  />
                )}
                {/* Overlay dégradé */}
                <div className={`absolute inset-0 bg-gradient-to-t ${CAT_COLORS[i % CAT_COLORS.length]}`} />
                {/* Content */}
                <div className="relative h-full flex flex-col justify-end p-5">
                  <p className="font-bold text-lg text-white group-hover:text-accent transition-smooth">{c.label}</p>
                  <p className="text-xs text-white/70 inline-flex items-center gap-1 mt-1">{t("cats.explore")} <ArrowRight className="h-3 w-3" /></p>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Categories;
