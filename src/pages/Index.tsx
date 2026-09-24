import Header from "@/components/jangolo/Header";
import SEO from "@/components/SEO";
import Footer from "@/components/jangolo/Footer";
import ProductCard from "@/components/jangolo/ProductCard";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useProducts, useProductsList, PRODUCTS_PER_PAGE } from "@/hooks/useProducts";
import { CATEGORY_TREE as CATEGORIES } from "@/lib/jangolo";
import { resolveImg } from "@/lib/images";
import { useI18n } from "@/contexts/I18nContext";
import { useState, useRef, useEffect } from "react";
import { ShieldCheck, Truck, MessageCircle, ArrowRight, Star, Cog, Sparkles, Flame, ChevronLeft, ChevronRight, Bike, HelpCircle, ChevronDown, Zap } from "lucide-react";

const ICONS: Record<string, any> = {
  "trottinettes-electriques": Zap, "surron-motos-electriques": Bike, "accessoires-mobilite": Cog,
};

// ─── Hero Carousel ──────────────────────────────────────────────────────────
const HERO_SLIDES = [
  {
    id: "trottinettes",
    image: "https://images.unsplash.com/photo-1604868189265-219ba7a3c6a5?w=1600&q=80",
    accent: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    label: "Trottinettes électriques",
    title: "Roulez plus vite, plus loin",
    subtitle: "Trottinettes électriques urbaines et tout-terrain, jusqu'à 60 km d'autonomie, livrées partout en France.",
    cta: { label: "Découvrir les trottinettes", to: "/category/trottinettes-electriques", color: "bg-primary hover:bg-primary-hover" },
  },
  {
    id: "surron",
    image: "https://images.unsplash.com/photo-1622185135505-2d795003994a?w=1600&q=80",
    accent: "bg-lime-500/20 text-lime-300 border-lime-500/30",
    label: "Surron & Motos électriques",
    title: "La puissance électrique sans limites",
    subtitle: "Motos électriques type Surron pour la ville comme le tout-terrain. Silencieuses, puissantes, sans essence.",
    cta: { label: "Voir les motos électriques", to: "/category/surron-motos-electriques", color: "bg-accent text-accent-foreground hover:bg-accent/90" },
  },
  {
    id: "dirt-bike",
    image: "https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?w=1600&q=80",
    accent: "bg-violet-500/20 text-violet-300 border-violet-500/30",
    label: "Dirt bike électrique",
    title: "Prêt pour le tout-terrain",
    subtitle: "Des motos électriques taillées pour le cross et les sentiers, sans bruit ni entretien moteur.",
    cta: { label: "Découvrir les dirt bikes", to: "/category/dirt-bike-electrique", color: "bg-primary hover:bg-primary-hover" },
  },
  {
    id: "accessoires",
    image: "https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=1600&q=80",
    accent: "bg-blue-500/20 text-blue-300 border-blue-500/30",
    label: "Accessoires moto",
    title: "Tout pour équiper votre Surron",
    subtitle: "Batteries, chargeurs, casques, protections et pièces de rechange pour votre moto électrique.",
    cta: { label: "Voir les accessoires", to: "/category/accessoires-mobilite", color: "bg-primary hover:bg-primary-hover" },
  },
  {
    id: "promos",
    image: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=80",
    accent: "bg-amber-500/20 text-amber-300 border-amber-500/30",
    label: "Promotions",
    title: "Des offres à ne pas manquer",
    subtitle: "Profitez de nos meilleures promotions sur une sélection de produits.",
    cta: { label: "Voir les promos", to: "/promotions", color: "bg-accent text-accent-foreground hover:bg-accent/90" },
  },
];

const HeroCarousel = () => {
  const slides = HERO_SLIDES;
  const [active, setActive] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [transitioning, setTransitioning] = useState(false);
  const [paused, setPaused] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const touchStartX = useRef<number | null>(null);

  const stopTimer = () => {
    if (timer.current) clearInterval(timer.current);
  };

  const startTimer = () => {
    stopTimer();
    timer.current = setInterval(() => {
      setActive(cur => {
        const next = (cur + 1) % slides.length;
        setPrev(cur);
        setTransitioning(true);
        setTimeout(() => { setPrev(null); setTransitioning(false); }, 800);
        return next;
      });
    }, 30000);
  };

  useEffect(() => {
    if (!paused) startTimer();
    else stopTimer();
    return stopTimer;
  }, [paused]);

  const goTo = (idx: number) => {
    if (idx === active || transitioning) return;
    setPrev(active);
    setTransitioning(true);
    setActive(idx);
    setTimeout(() => { setPrev(null); setTransitioning(false); }, 800);
    if (!paused) startTimer();
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      if (diff > 0) goTo((active + 1) % slides.length);
      else goTo((active - 1 + slides.length) % slides.length);
    }
    touchStartX.current = null;
  };

  const slide = slides[active];

  return (
    <section
      className="relative overflow-hidden min-h-[560px] md:min-h-[620px] flex items-center -mt-20 pt-20 pb-14"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Toutes les slides toujours dans le DOM — crossfade CSS pur, zéro flash */}
      {slides.map((s, i) => (
        <div
          key={s.id}
          className="absolute inset-0"
          style={{
            zIndex: 1,
            opacity: i === active ? 1 : 0,
            transition: "opacity 800ms ease-in-out",
          }}
        >
          <img src={s.image} alt={s.label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />
        </div>
      ))}

      {/* Contenu */}
      <div
        className="container relative py-10 md:py-16 pb-16 md:pb-20"
        style={{ zIndex: 3 }}
      >
        <div className="max-w-2xl space-y-5">

          {/* Titre */}
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-white drop-shadow-2xl">
            {slide.title}
          </h1>

          {/* Sous-titre */}
          <p className="text-white text-sm md:text-lg max-w-lg leading-relaxed font-medium drop-shadow-lg" style={{ textShadow: "0 2px 12px rgba(0,0,0,0.8)" }}>
            {slide.subtitle}
          </p>

          {/* CTA */}
          <div className="flex flex-wrap gap-3 pt-2">
            {slide.cta.href ? (
              <a
                href={slide.cta.href}
                target="_blank"
                rel="noreferrer"
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all ${slide.cta.color}`}
              >
                {slide.cta.label} <ArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <Button asChild size="lg" className={`font-bold text-white shadow-lg border-0 ${slide.cta.color}`}>
                <Link to={slide.cta.to!}>
                  {slide.cta.label} <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            )}
            <Button asChild size="lg" variant="outline" className="bg-white/15 text-white border-white/50 hover:bg-white/25 font-semibold backdrop-blur-sm">
              <Link to="/categories">Explorer la boutique</Link>
            </Button>
          </div>

          {/* Badges confiance */}
          <div className="flex flex-wrap gap-4 pt-2">
            {[
              { icon: ShieldCheck, label: "Paiement sécurisé" },
              { icon: Truck, label: "Livraison express" },
              { icon: MessageCircle, label: "Service client réactif" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-xs font-semibold text-white" style={{ textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}>
                <span className="h-7 w-7 rounded-full bg-black/50 border border-white/30 flex items-center justify-center">
                  <b.icon className="h-3.5 w-3.5 text-white" />
                </span>
                {b.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Barre de navigation : < • • • || • • > */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/40 backdrop-blur-sm border-t border-white/10">
        <div className="container flex items-center justify-center gap-3 py-3">
          {/* Prev */}
          <button
            onClick={() => goTo((active - 1 + slides.length) % slides.length)}
            className="text-white/60 hover:text-white transition-colors text-base font-bold leading-none select-none"
            aria-label="Précédent"
          >
            &#8249;
          </button>

          {/* Dots */}
          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`rounded-full transition-all duration-300 ${i === active ? "w-5 h-1.5 bg-primary" : "w-1.5 h-1.5 bg-white/35 hover:bg-white/60"}`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          {/* Séparateur */}
          <span className="text-white/30 text-xs font-light select-none">||</span>

          {/* Pause / Play */}
          <button
            onClick={() => setPaused(p => !p)}
            className="text-white/60 hover:text-white transition-colors text-xs font-bold select-none w-6 flex items-center justify-center"
            aria-label={paused ? "Reprendre" : "Pause"}
          >
            {paused ? (
              <span className="text-primary">▶</span>
            ) : (
              <span>⏸</span>
            )}
          </button>

          {/* Next */}
          <button
            onClick={() => goTo((active + 1) % slides.length)}
            className="text-white/60 hover:text-white transition-colors text-base font-bold leading-none select-none"
            aria-label="Suivant"
          >
            &#8250;
          </button>
        </div>
      </div>
    </section>
  );
};

// ─── Page principale ─────────────────────────────────────────────────────────
const Index = () => {
  const { t, formatPrice } = useI18n();
  const [page, setPage] = useState(1);
  const productsSectionRef = useRef<HTMLElement>(null);

  const scrollToProducts = () => {
    const el = productsSectionRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: "smooth" });
  };

  const { data: pageData } = useProducts({ page, pageSize: PRODUCTS_PER_PAGE });
  const { data: trending = [] } = useProductsList({ trending: true });
  const { data: promo = [] } = useProductsList({ promo: true });


  const products = pageData?.products ?? [];
  const totalPages = pageData?.totalPages ?? 1;
  const total = pageData?.total ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Trottinettes & Motos Surron en France"
        description="SkyRide Store — Trottinettes électriques et motos électriques type Surron en France. Livraison partout en France. Paiement par carte cadeau, PayPal ou crypto-monnaie."
        url="/"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'ItemList',
          'name': 'Trottinettes & Surron SkyRide Store',
          'description': 'Catalogue de trottinettes électriques et motos électriques type Surron en France'
        }}
      />
      <Header />

      {/* HERO CAROUSEL */}
      <HeroCarousel />

      {/* CATEGORIES */}
      <section className="container py-10 md:py-14">
        <h2 className="text-2xl md:text-3xl font-bold mb-6">{t("home.cats.title")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {CATEGORIES.map((c, i) => {
            const Icon = ICONS[c.slug] || Sparkles;
            return (
              <Link key={c.slug} to={`/category/${c.slug}`} className="group relative aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-warm border border-border/50 p-5 flex flex-col justify-between hover:shadow-warm transition-smooth">
                <span className={`h-10 w-10 rounded-xl flex items-center justify-center text-xl ${
                  i % 4 === 0 ? "bg-primary/15 text-primary" :
                  i % 4 === 1 ? "bg-secondary/15 text-secondary" :
                  i % 4 === 2 ? "bg-accent/30 text-accent-foreground" :
                  "bg-success/15 text-success"
                }`}><Icon className="h-5 w-5" /></span>
                <div>
                  <p className="font-bold text-foreground group-hover:text-primary transition-smooth">{c.label}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">{t("home.cats.see")} <ArrowRight className="h-3 w-3" /></p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* TOUS LES PRODUITS AVEC PAGINATION */}
      <section ref={productsSectionRef} className="container py-6 md:py-10">
        <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold">Nos produits</h2>
            <p className="text-muted-foreground text-sm mt-1">{total} article{total > 1 ? "s" : ""} disponibles</p>
          </div>
          <Link to="/categories" className="text-sm text-primary flex items-center gap-1 hover:underline">
            Voir par catégorie <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
          {products.length === 0 && (
            <p className="col-span-4 text-center text-muted-foreground py-10">Chargement des produits...</p>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
            <button
              onClick={() => { setPage(p => Math.max(1, p - 1)); scrollToProducts(); }}
              disabled={page === 1}
              className="h-9 w-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-smooth"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                onClick={() => { setPage(p); scrollToProducts(); }}
                className={`h-9 w-9 rounded-xl text-sm font-semibold transition-smooth ${
                  p === page ? "bg-primary text-primary-foreground shadow-warm" : "border border-border hover:bg-muted"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => { setPage(p => Math.min(totalPages, p + 1)); scrollToProducts(); }}
              disabled={page === totalPages}
              className="h-9 w-9 rounded-xl border border-border flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-smooth"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </section>

      {/* TENDANCES */}
      {trending.length > 0 && (
        <section id="tendance" className="container py-6 md:py-10">
          <div className="flex items-end justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Flame className="h-5 w-5 text-destructive" />
                <h2 className="text-2xl md:text-3xl font-bold">{t("home.trending.title")}</h2>
              </div>
              <p className="text-muted-foreground text-sm">Les plus populaires du moment</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {trending.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* PROMO BANNER */}
      <section className="container py-10">
        <div className="rounded-3xl overflow-hidden bg-gradient-dark text-background p-8 md:p-12 grid md:grid-cols-2 gap-6 items-center">
          <div>
            <span className="inline-block bg-accent text-accent-foreground text-xs font-bold px-3 py-1 rounded-full">{t("home.promo.kicker")}</span>
            <h2 className="text-3xl md:text-4xl font-extrabold mt-3 leading-tight">
              {t("home.promo.title1")} <span className="text-accent">-30%</span> {t("home.promo.title2")}
            </h2>
            <p className="text-background/80 mt-2">{t("home.promo.subtitle")}</p>
            <Button asChild size="lg" className="mt-5 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
              <Link to="/promotions">{t("home.promo.cta")}</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {promo.slice(0, 4).map((p) => (
              <Link key={p.id} to={`/product/${p.slug}`} className="bg-background text-foreground rounded-xl p-3 hover:scale-[1.02] transition-smooth">
                <div className="aspect-square rounded-lg overflow-hidden mb-2">
                  <img src={resolveImg(p.image_url)} alt={p.name} loading="lazy" className="w-full h-full object-cover" />
                </div>
                <p className="text-xs font-semibold line-clamp-1">{p.name}</p>
                <p className="text-xs font-bold text-primary">{formatPrice(p.price_xaf)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="container py-10 md:py-14">
        <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">{t("home.testimonials.title")}</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { name: "Julien M., Lyon", text: "Commande livrée en moins de 48h ! J'ai payé avec ma carte cadeau, super simple. Je recommande vivement." },
            { name: "Camille D., Bordeaux", text: "Enfin une boutique en ligne fiable pour trouver une Surron en France. La moto reçue était exactement comme décrite." },
            { name: "Thomas R., Marseille", text: "Le service client est top. Ils ont répondu à toutes mes questions avant l'achat." },
          ].map((tt) => (
            <div key={tt.name} className="bg-card rounded-2xl p-5 shadow-soft border border-border/50">
              <div className="flex gap-0.5 mb-2">
                {[1,2,3,4,5].map((i) => <Star key={i} className="h-4 w-4 fill-accent text-accent" />)}
              </div>
              <p className="text-sm text-foreground/80 leading-relaxed mb-3">"{tt.text}"</p>
              <p className="text-xs font-semibold text-muted-foreground">— {tt.name}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="container py-10 md:py-14">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-primary font-semibold text-sm mb-2">
            <HelpCircle className="h-4 w-4" /> Questions fréquentes
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">Tout ce qu'il faut savoir</h2>
        </div>
        <div className="max-w-2xl mx-auto space-y-3">
          {[
            {
              q: "Combien de temps prend la livraison ?",
              a: "Comptez 24 à 48h en livraison express, ou 3 à 5 jours ouvrés en livraison standard, partout en France métropolitaine.",
            },
            {
              q: "Quels moyens de paiement acceptez-vous ?",
              a: "Vous pouvez régler par carte cadeau (Amazon, Apple, Google Play…) ou en crypto-monnaie (Bitcoin, USDT).",
            },
            {
              q: "Les motos Surron sont-elles homologuées pour la route ?",
              a: "Cela dépend du modèle et de sa configuration. Nous précisons pour chaque produit son usage prévu (route, tout-terrain, mixte) sur la fiche produit. Renseignez-vous sur la réglementation locale avant utilisation sur la voie publique.",
            },
            {
              q: "Puis-je retourner un produit ?",
              a: "Oui, vous disposez de 7 jours après réception pour nous contacter et organiser un retour ou un échange si le produit ne convient pas.",
            },
            {
              q: "Proposez-vous une garantie ?",
              a: "Tous nos véhicules et accessoires bénéficient d'une garantie. La durée varie selon le produit et est indiquée sur chaque fiche produit.",
            },
            {
              q: "Comment suivre ma commande ?",
              a: "Une fois votre commande confirmée, vous recevez une référence de suivi. Rendez-vous sur la page \"Suivre ma commande\" pour connaître son statut en temps réel.",
            },
          ].map((item, i) => (
            <details key={i} className="group bg-card rounded-2xl border border-border/50 shadow-soft overflow-hidden">
              <summary className="flex items-center justify-between gap-3 p-4 md:p-5 cursor-pointer list-none font-semibold text-sm md:text-base">
                {item.q}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="px-4 md:px-5 pb-4 md:pb-5 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
