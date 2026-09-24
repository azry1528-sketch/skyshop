import { useParams, Link } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import Header from "@/components/jangolo/Header";
import Footer from "@/components/jangolo/Footer";
import ProductCard from "@/components/jangolo/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/components/jangolo/ProductCard";
import { CATEGORIES, CATEGORY_GROUPS } from "@/lib/jangolo";
import { useI18n } from "@/contexts/I18nContext";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Images de fond par catégorie (légèrement floutées)
const CAT_BG: Record<string, string> = {
  "trottinettes-electriques": "https://images.unsplash.com/photo-1604868189265-219ba7a3c6a5?w=1200&q=80",
  "surron-motos-electriques": "https://images.unsplash.com/photo-1622185135505-2d795003994a?w=1200&q=80",
  "accessoires-mobilite": "https://images.unsplash.com/photo-1508444845599-5c89863b1c44?w=1200&q=80",
};

const PAGE_SIZE = 12;

const Category = () => {
  const { t } = useI18n();
  const { category } = useParams();
  const cat = CATEGORIES.find((c) => c.slug === category);
  const subCategories = category ? CATEGORY_GROUPS[category] : undefined;

  const [items, setItems] = useState<Product[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const seenIds = useRef<Set<string>>(new Set());

  const loadMore = useCallback(async (reset = false) => {
    if (subCategories) return; // group page: no products fetch
    if (loading || (done && !reset)) return;
    setLoading(true); setError(null);
    const currentPage = reset ? 0 : page;
    const from = currentPage * PAGE_SIZE;
    let q = supabase.from("products").select("*").order("created_at", { ascending: false });
    if (category) q = q.eq("category", category);
    const { data, error: err } = await q.range(from, from + PAGE_SIZE - 1);
    if (err) { setError(err.message); setLoading(false); return; }
    const incoming = (data as Product[]) || [];
    const fresh = incoming.filter(p => !seenIds.current.has(p.id));
    fresh.forEach(p => seenIds.current.add(p.id));
    setItems(prev => reset ? fresh : [...prev, ...fresh]);
    setPage(currentPage + 1);
    setDone(incoming.length < PAGE_SIZE);
    setLoading(false);
  }, [category, page, loading, done, subCategories]);

  useEffect(() => {
    seenIds.current = new Set();
    setItems([]); setPage(0); setDone(false); setError(null);
    if (!subCategories) loadMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category]);

  useEffect(() => {
    if (subCategories || !sentinel.current) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: "200px" });
    obs.observe(sentinel.current);
    return () => obs.disconnect();
  }, [loadMore, subCategories]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 md:py-12">
        {/* Hero avec image de fond floutée */}
        {(() => {
          const bg = CAT_BG[category || ""];
          return (
            <div className="relative rounded-3xl overflow-hidden mb-8 min-h-[160px] md:min-h-[220px] flex items-end">
              {bg && (
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${bg})`, filter: "blur(3px)", transform: "scale(1.05)" }}
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
              <div className="relative px-6 py-6 md:px-10 md:py-8 w-full">
                <p className="text-xs text-white/70 mb-1">{t("cat.shop")} / {cat?.label || category}</p>
                <h1 className="text-2xl md:text-4xl font-extrabold text-white">{cat?.label || t("cat.products")}</h1>
                {!subCategories && <p className="text-white/70 mt-1 text-sm">{items.length} {items.length > 1 ? t("cat.articles_many") : t("cat.articles_one")}</p>}
                {subCategories && <p className="text-white/70 mt-1 text-sm">{t("cat.choose_sub")}</p>}
              </div>
            </div>
          );
        })()}

        {subCategories ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {subCategories.map((s) => {
              const bg = CAT_BG[s.slug];
              return (
                <Link key={s.slug} to={`/category/${s.slug}`}
                  className="group aspect-[4/3] rounded-2xl overflow-hidden relative border border-border/50 hover:shadow-warm transition-smooth">
                  {bg ? (
                    <>
                      <div
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                        style={{ backgroundImage: `url(${bg})`, filter: "blur(1.5px)", transform: "scale(1.05)" }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                      <div className="relative h-full flex flex-col justify-end p-4">
                        <p className="font-bold text-white group-hover:text-accent transition-smooth">{s.label}</p>
                        <p className="text-xs text-white/70 inline-flex items-center gap-1 mt-1">{t("cat.see")} <ArrowRight className="h-3 w-3" /></p>
                      </div>
                    </>
                  ) : (
                    <div className="h-full bg-gradient-warm p-5 flex flex-col justify-between">
                      <span className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center"><Sparkles className="h-5 w-5" /></span>
                      <div>
                        <p className="font-bold group-hover:text-primary transition-smooth">{s.label}</p>
                        <p className="text-xs text-muted-foreground inline-flex items-center gap-1">{t("cat.see")} <ArrowRight className="h-3 w-3" /></p>
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        ) : error ? (
          <div className="text-center py-16 max-w-md mx-auto">
            <AlertTriangle className="h-10 w-10 mx-auto text-destructive mb-3" />
            <h3 className="text-lg font-bold mb-1">{t("cat.error_title")}</h3>
            <p className="text-sm text-muted-foreground mb-4">{t("cat.error_desc")}</p>
            <Button onClick={() => loadMore(true)} variant="outline">{t("search.retry")}</Button>
          </div>
        ) : items.length === 0 && loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square rounded-2xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>{t("cat.empty")}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
            <div ref={sentinel} className="py-8 text-center text-sm text-muted-foreground">
              {loading ? <span className="inline-flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> {t("search.loading")}</span> : done && items.length > 0 ? t("search.all_shown") : ""}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Category;
