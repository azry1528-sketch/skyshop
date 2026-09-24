import { useParams, Link, useLocation } from "react-router-dom";
import PreorderBadge from "@/components/jangolo/PreorderBadge";
import PreorderCountdown from "@/components/jangolo/PreorderCountdown";
import SEO from "@/components/SEO";
import Header from "@/components/jangolo/Header";
import Footer from "@/components/jangolo/Footer";
import { useProduct, useProductsList } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/lib/jangolo";
import { resolveImg } from "@/lib/images";
import { useCart } from "@/contexts/CartContext";
import { useI18n } from "@/contexts/I18nContext";
import { toast } from "sonner";
import { useState, useEffect, useRef } from "react";
import {
  MessageCircle, Minus, Plus, ShieldCheck, Truck, RefreshCw, Star,
  Flame, CheckCircle2, Package2, Sparkles, Share2, FileText, Download, Copy,
  Calendar, Gift, AlertTriangle, Users, ChevronLeft, ChevronRight,
} from "lucide-react";
import ProductCard from "@/components/jangolo/ProductCard";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { pixelViewContent } from "@/lib/fbPixel";

const isImageUrl = (s: string) =>
  /\.(png|jpe?g|webp|gif|avif|svg)(\?.*)?$/i.test(s) ||
  /^https?:\/\/.*\/(image|img)\//i.test(s);

type Review = {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: { full_name?: string; email?: string };
};

const StarRow = ({ value, onChange }: { value: number; onChange?: (v: number) => void }) => (
  <div className="flex gap-0.5">
    {[1, 2, 3, 4, 5].map(i => (
      <Star
        key={i}
        className={`h-5 w-5 ${i <= value ? "fill-accent text-accent" : "text-muted-foreground/30"} ${onChange ? "cursor-pointer" : ""}`}
        onClick={() => onChange?.(i)}
      />
    ))}
  </div>
);

const ProductDetail = () => {
  const { slug } = useParams();
  const { t, formatPrice } = useI18n();
  const { data: product, isLoading } = useProduct(slug);
  const { add } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const goNext = () => setActiveImg(prev => (prev + 1) % gallery.length);
  const goPrev = () => setActiveImg(prev => (prev - 1 + gallery.length) % gallery.length);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setIsSwiping(false);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartX.current || !touchStartY.current) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    // Only swipe horizontally if more horizontal than vertical
    if (Math.abs(dx) > Math.abs(dy)) {
      setIsSwiping(true);
      setSwipeOffset(dx);
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current) return;
    if (isSwiping) {
      if (swipeOffset < -50 && gallery.length > 1) goNext();
      else if (swipeOffset > 50 && gallery.length > 1) goPrev();
    }
    touchStartX.current = null;
    touchStartY.current = null;
    setSwipeOffset(0);
    setIsSwiping(false);
  };
  const { data: related = [] } = useProductsList({ category: (product as any)?.category });

  // Option produit sélectionnée
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  // Reviews state
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewsLoaded, setReviewsLoaded] = useState(false);

  // Share state
  const [copied, setCopied] = useState(false);

  // ✅ Hooks précommande — doivent être avant tout return conditionnel
  const [preorderMode, setPreorderMode] = useState<"deposit" | "full">("deposit");
  const [preorderCount, setPreorderCount] = useState(0);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share && window.isSecureContext) {
      try {
        await navigator.share({
          title: (product as any)?.name || "SkyRide Store",
          text: `Découvrez ${(product as any)?.name} sur SkyRide Store !`,
          url,
        });
        return;
      } catch { /* annulé ou non supporté, fallback clipboard */ }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Lien copié dans le presse-papier !");
    } catch {
      toast.error("Copiez ce lien manuellement : " + url);
    }
  };

  // Load preorder count
  useEffect(() => {
    if (!product) return;
    const prod: any = product;
    if (!prod.is_preorder || !prod.id) return;
    supabase.from("orders")
      .select("id", { count: "exact", head: true })
      .eq("is_preorder", true)
      .then(({ count }) => setPreorderCount(count || 0));
  }, [product]);

  // Pixel Facebook : ViewContent dès que la fiche produit est chargée
  useEffect(() => {
    if (!product) return;
    const prod: any = product;
    pixelViewContent({ id: prod.id, name: prod.name, price_xaf: prod.price_xaf });
  }, [product]);

  // Load reviews
  useEffect(() => {
    if (!product) return;
    const p: any = product;
    supabase
      .from("reviews" as any)
      .select("*")
      .eq("product_id", p.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setReviews(data as Review[]);
        setReviewsLoaded(true);
      });
  }, [product]);

  const submitReview = async () => {
    if (!user) { toast.error("Connectez-vous pour laisser un avis."); return; }
    if (!reviewComment.trim()) { toast.error("Veuillez écrire un commentaire."); return; }
    const p: any = product;
    setSubmittingReview(true);
    const { error } = await supabase.from("reviews" as any).insert({
      product_id: p.id,
      user_id: user.id,
      rating: reviewRating,
      comment: reviewComment.trim(),
    });
    setSubmittingReview(false);
    if (error) { toast.error("Erreur lors de l'envoi de l'avis."); return; }
    toast.success("Avis publié !");
    setReviewComment("");
    setReviewRating(5);
    const { data } = await supabase
      .from("reviews" as any)
      .select("*, profiles(full_name, email)")
      .eq("product_id", p.id)
      .order("created_at", { ascending: false });
    if (data) setReviews(data as Review[]);
  };

  const handleBuyNow = () => {
    const p: any = product;
    const activeOpt = (p.options || []).find((o: any) => o.id === selectedOption);
    const unitPrice = activeOpt ? activeOpt.price_xaf : p.price_xaf;
    add({
      id: p.id, slug: p.slug,
      name: activeOpt ? `${p.name} — ${activeOpt.name}` : p.name,
      price_xaf: unitPrice,
      image_url: p.image_url,
      selectedOptionName: activeOpt?.name,
      optionId: activeOpt?.id,
    }, qty);
    window.location.href = "/checkout";
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center text-muted-foreground">
      {t("pd.loading")}
    </div>
  );
  if (!product) return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold mb-2">{t("pd.not_found")}</h1>
        <Button asChild><Link to="/">{t("pd.back_home")}</Link></Button>
      </div>
    </div>
  );

  const p: any = product;
  const cat = CATEGORIES.find((c) => c.slug === p.category);
  const discount = p.old_price_xaf ? Math.round((1 - p.price_xaf / p.old_price_xaf) * 100) : 0;
  const gallery: string[] = [p.image_url, ...((p.gallery_urls as string[]) || [])].filter(Boolean);
  const benefits: string[] = (p.benefits as string[]) || [];
  const benefitImages: string[] = (p.benefit_images as string[]) || [];

  // ✅ PRÉCOMMANDE — variables dérivées de p (pas des hooks)
  const isPreorder: boolean = !!p.is_preorder;
  const preorderLabel: string = p.preorder_label || "Prévente exclusive";
  const preorderDate: string | null = p.preorder_date || null;
  const preorderDeadline: string | null = p.preorder_deadline || null;
  const preorderMaxUnits: number | null = p.preorder_max_units || null;
  const preorderDepositPct: number = p.preorder_deposit_pct || 30;
  const preorderBonus: string | null = p.preorder_bonus || null;

  // basePrice calculé après activeOption (voir plus bas)
  const specsAll: Record<string, string> = p.specifications || {};
  const specsText = Object.entries(specsAll).filter(([_, v]) => !isImageUrl(String(v)));
  const specsImages = Object.entries(specsAll).filter(([_, v]) => isImageUrl(String(v)));
  const box: string[] = (p.box_contents as string[]) || [];
  const isYoutube = p.video_url && /youtube\.com|youtu\.be/.test(p.video_url);
  const youtubeEmbedUrl = (() => {
    if (!p.video_url) return "";
    try {
      const url = new URL(p.video_url);
      let videoId = url.searchParams.get("v");
      if (!videoId && url.hostname === "youtu.be") videoId = url.pathname.slice(1);
      if (!videoId && url.pathname.includes("/embed/")) return p.video_url;
      return videoId ? `https://www.youtube.com/embed/${videoId}` : p.video_url;
    } catch { return p.video_url; }
  })();
  const manuals: string[] = (p.manuals as string[]) || [];
  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)
    : p.rating;

  // ✅ Options produit (remplacent les "offres" / bundles inline)
  // Lues depuis p.options si elles existent (tableau [{id, name, description, price_xaf, old_price_xaf}])
  // Supabase peut renvoyer un JSON string ou un tableau selon le type de colonne
  const productOptions: Array<{ id: string; name: string; description?: string; price_xaf: number; old_price_xaf?: number }> = (() => {
    const raw = p.options;
    if (!raw) return [];
    if (typeof raw === "string") {
      try { return JSON.parse(raw); } catch { return []; }
    }
    if (Array.isArray(raw)) return raw.filter((o: any) => o.name && o.price_xaf > 0);
    return [];
  })();

  const activeOption = productOptions.find(o => o.id === selectedOption);
  // basePrice = prix UNITAIRE de l'offre sélectionnée, ou prix de base du produit
  const basePrice = activeOption ? activeOption.price_xaf : p.price_xaf;
  // displayPrice = ce que le client paie réellement = prix unitaire × quantité
  const displayPrice = basePrice * qty;
  const depositAmount = Math.round(basePrice * (preorderDepositPct / 100));
  const remainingAmount = basePrice - depositAmount;
  const displayOldPrice = activeOption?.old_price_xaf
    ? activeOption.old_price_xaf * qty
    : p.old_price_xaf ? p.old_price_xaf * qty : null;

  // Description courte (résumé) et longue
  const shortDescription = p.description || "";
  const longDescription = p.long_description || "";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={p.name}
        description={p.description || undefined}
        url={"/product/" + p.slug}
        type="product"
        schema={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: p.name,
          description: p.description,
          image: p.image_url,
          offers: {
            "@type": "Offer",
            price: p.price_xaf,
            priceCurrency: "EUR",
            availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            seller: { "@type": "Organization", name: "SkyRide Store" },
          },
        }}
      />
      <Header />
      <main className="container py-6 md:py-10 overflow-x-hidden">
        {/* Breadcrumb */}
        <nav className="text-xs text-muted-foreground mb-4 flex items-center gap-1">
          <Link to="/" className="hover:text-primary">{t("nav.home")}</Link> /
          <Link to={`/category/${p.category}`} className="hover:text-primary">{cat?.label}</Link> /
          <span className="text-foreground truncate max-w-[200px]">{p.name}</span>
          <button
            onClick={handleShare}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 text-xs font-semibold transition-smooth"
            title="Partager ce produit"
          >
            {copied
              ? <><Copy className="h-3.5 w-3.5 text-success" /> Lien copié !</>
              : <><Share2 className="h-3.5 w-3.5" /> Partager</>}
          </button>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 min-w-0 overflow-hidden">
          {/* Galerie */}
          <div className="w-full min-w-0">
            {/* Image principale avec swipe */}
            <div
              className="relative w-full aspect-square rounded-3xl overflow-hidden bg-muted shadow-soft select-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <img
                src={resolveImg(gallery[activeImg])}
                alt={p.name}
                className="w-full h-full object-contain transition-transform duration-200"
                style={{ transform: isSwiping ? `translateX(${swipeOffset * 0.3}px)` : "translateX(0)" }}
                draggable={false}
              />
              {/* Flèches navigation (visibles si > 1 image) */}
              {gallery.length > 1 && (
                <>
                  <button
                    onClick={goPrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full p-1.5 shadow-md transition-smooth"
                    aria-label="Image précédente"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    onClick={goNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-background/80 hover:bg-background text-foreground rounded-full p-1.5 shadow-md transition-smooth"
                    aria-label="Image suivante"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {gallery.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveImg(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeImg ? "bg-primary w-4" : "bg-background/70"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Vignettes supplémentaires — défilement horizontal */}
            {gallery.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {gallery.map((g, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`shrink-0 w-16 h-16 md:w-20 md:h-20 rounded-xl overflow-hidden border-2 transition-smooth ${i === activeImg ? "border-primary" : "border-transparent opacity-60 hover:opacity-90"}`}
                  >
                    <img src={resolveImg(g)} alt={`${p.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Infos produit */}
          <div className="space-y-5">
            {/* Badges + titre */}
            <div>
              <div className="flex flex-wrap gap-2 mb-3">
                {p.is_promo && discount > 0 && (
                  <span className="bg-destructive text-destructive-foreground text-xs font-bold px-2.5 py-1 rounded-full">
                    -{discount}% {t("pd.promo")}
                  </span>
                )}
                {p.is_trending && !isPreorder && (
                  <span className="bg-accent text-accent-foreground text-xs font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                    <Flame className="h-3 w-3" /> {t("pd.trending")}
                  </span>
                )}
                {isPreorder && <PreorderBadge label={preorderLabel} />}
                {!isPreorder && p.stock < 15 && (
                  <span className="bg-foreground text-background text-xs font-bold px-2.5 py-1 rounded-full">
                    {t("pd.stock_low")} · {p.stock}
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{p.name}</h1>
              <div className="flex items-center gap-2 mt-2 text-sm">
                <StarRow value={Math.round(avgRating)} />
                <span className="font-medium">{avgRating.toFixed(1)}</span>
                <span className="text-muted-foreground">({reviews.length || p.reviews_count} {t("pd.reviews")})</span>
              </div>
            </div>

            {/* Prix */}
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-4xl font-extrabold text-primary">{formatPrice(displayPrice)}</span>
              {displayOldPrice && (
                <span className="text-lg text-muted-foreground line-through">{formatPrice(displayOldPrice)}</span>
              )}
              {qty > 1 && (
                <span className="text-sm text-muted-foreground ml-1">({qty} × {formatPrice(basePrice)})</span>
              )}
            </div>

            {/* ✅ Description courte — sous le prix */}
            {shortDescription && (
              <p className="text-foreground/80 leading-relaxed">{shortDescription}</p>
            )}

            {/* ✅ Options produit — après la description, AVANT le sélecteur de quantité */}
            {productOptions.length > 0 && (
              <div className="pt-3 border-t border-border">
                <p className="text-sm font-bold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Choisissez votre offre
                </p>
                <div className="space-y-2">
                  {productOptions.map((opt) => {
                    const optDiscount = opt.old_price_xaf
                      ? Math.round((1 - opt.price_xaf / opt.old_price_xaf) * 100)
                      : 0;
                    const isSelected = selectedOption === opt.id;
                    return (
                      <div
                        key={opt.id}
                        onClick={() => {
                          setSelectedOption(isSelected ? null : opt.id);
                          setQty(1);
                        }}
                        className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-smooth ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-sm"
                            : "border-border hover:border-primary/50"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />}
                            <p className="font-semibold text-sm">{opt.name}</p>
                          </div>
                          {opt.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{opt.description}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className="font-extrabold text-primary text-sm">{formatPrice(opt.price_xaf)}</p>
                          {optDiscount > 0 && (
                            <p className="text-xs text-destructive font-bold">-{optDiscount}%</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ═══ PRÉCOMMANDE UI ═══ */}
            {isPreorder && (
              <div className="space-y-3 pt-2">
                {/* Compte à rebours */}
                {preorderDeadline && <PreorderCountdown deadline={preorderDeadline} />}

                {/* Barre de progression stock */}
                {preorderMaxUnits && (
                  <div className="bg-muted/50 rounded-xl p-3">
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5 text-primary" /> {preorderCount} réservation{preorderCount > 1 ? "s" : ""}</span>
                      <span className="text-muted-foreground">{preorderMaxUnits} unités max</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-cta rounded-full transition-all"
                        style={{ width: `${Math.min((preorderCount / preorderMaxUnits) * 100, 100)}%` }}
                      />
                    </div>
                    {preorderMaxUnits - preorderCount <= 3 && preorderCount < preorderMaxUnits && (
                      <p className="text-xs text-destructive font-bold mt-1.5">⚡ Plus que {preorderMaxUnits - preorderCount} unité{preorderMaxUnits - preorderCount > 1 ? "s" : ""} disponible{preorderMaxUnits - preorderCount > 1 ? "s" : ""} !</p>
                    )}
                  </div>
                )}

                {/* Délai précommande — toujours affiché */}
                <div className="flex items-center gap-2 text-sm bg-primary/5 border border-primary/20 rounded-xl px-4 py-3">
                  <Calendar className="h-4 w-4 text-primary shrink-0" />
                  <span>⏱ Délai de livraison estimé : <strong>7 à 14 jours ouvrables</strong></span>
                </div>

                {/* Bonus précommande */}
                {preorderBonus && (
                  <div className="flex items-start gap-2 bg-success/10 border border-success/30 rounded-xl px-4 py-3">
                    <Gift className="h-4 w-4 text-success shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-success uppercase tracking-wide">Bonus précommande</p>
                      <p className="text-sm font-semibold mt-0.5">{preorderBonus}</p>
                    </div>
                  </div>
                )}

                {/* Quantité précommande */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">Quantité :</span>
                  <div className="flex items-center border border-border rounded-xl overflow-hidden">
                    <button onClick={() => setQty(Math.max(1, qty - 1))} className="h-9 w-9 flex items-center justify-center hover:bg-muted text-lg font-bold">−</button>
                    <span className="px-4 font-bold min-w-[2rem] text-center">{qty}</span>
                    <button onClick={() => setQty(qty + 1)} className="h-9 w-9 flex items-center justify-center hover:bg-muted text-lg font-bold">+</button>
                  </div>
                </div>

                {/* Choix acompte / paiement complet — radio buttons */}
                <div className="border border-border rounded-xl overflow-hidden">
                  <label className={`flex items-center gap-3 px-4 py-3 text-sm cursor-pointer transition-colors border-b border-border ${preorderMode === "deposit" ? "bg-primary/5" : "hover:bg-muted"}`}>
                    <input type="radio" name="preorderMode" value="deposit" checked={preorderMode === "deposit"} onChange={() => setPreorderMode("deposit")} className="accent-primary w-4 h-4 shrink-0" />
                    <div className="flex-1 text-left">
                      <p className="font-bold">Réserver avec acompte ({preorderDepositPct}%)</p>
                      <p className="text-muted-foreground text-xs">Reste {new Intl.NumberFormat("fr-FR").format(remainingAmount * qty)} € à la livraison</p>
                    </div>
                    <span className="text-primary font-extrabold">{new Intl.NumberFormat("fr-FR").format(depositAmount * qty)} €</span>
                  </label>
                  <label className={`flex items-center gap-3 px-4 py-3 text-sm cursor-pointer transition-colors ${preorderMode === "full" ? "bg-primary/5" : "hover:bg-muted"}`}>
                    <input type="radio" name="preorderMode" value="full" checked={preorderMode === "full"} onChange={() => setPreorderMode("full")} className="accent-primary w-4 h-4 shrink-0" />
                    <div className="flex-1 text-left">
                      <p className="font-bold">Payer maintenant</p>
                      <p className="text-muted-foreground text-xs">Rien à payer à la livraison</p>
                    </div>
                    <span className="font-extrabold">{new Intl.NumberFormat("fr-FR").format(basePrice * qty)} €</span>
                  </label>
                </div>

                {/* Comment payer l'acompte ? */}
                {preorderMode === "deposit" && (
                  <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wide">Comment souhaitez-vous payer l'acompte ?</p>
                    <div className="space-y-2">
                      {[
                        { v: "agency", label: "À l'agence", desc: "Venez payer directement en boutique" },
                        { v: "gift_card", label: "Carte cadeau", desc: "Payez avec le code d'une carte cadeau" },
                        { v: "crypto", label: "Crypto-monnaie", desc: "Payez en Bitcoin ou USDT" },
                      ].map(opt => (
                        <label key={opt.v} className="flex items-center gap-3 cursor-pointer">
                          <input type="radio" name="depositPayMethod" defaultChecked={opt.v === "gift_card"} className="accent-primary w-4 h-4 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{opt.label}</p>
                            <p className="text-xs text-amber-700 dark:text-amber-400">{opt.desc}</p>
                          </div>
                        </label>
                      ))}
                    </div>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 border-t border-amber-200 dark:border-amber-700 pt-2">
                      ⚠ La commande de précommande n'est prise en compte que lorsque l'acompte est réglé.
                    </p>
                  </div>
                )}

                {/* Boutons précommande */}
                <div className="flex gap-2">
                  <Button
                    size="lg"
                    className="flex-1 h-12 bg-gradient-cta hover:opacity-90 shadow-warm font-bold"
                    onClick={() => {
                      const chargedPrice = preorderMode === "deposit" ? depositAmount : basePrice;
                      add({
                        id: p.id, slug: p.slug, name: p.name,
                        price_xaf: chargedPrice,
                        image_url: p.image_url,
                        is_preorder: true,
                        deposit_pct: preorderMode === "deposit" ? preorderDepositPct : 100,
                        remaining_xaf: preorderMode === "deposit" ? remainingAmount : 0,
                      } as any, qty);
                      window.location.href = "/checkout";
                    }}
                  >
                    Précommander
                  </Button>
                </div>

                {/* Conditions précommande */}
                <p className="text-xs text-muted-foreground text-center px-2">
                  Précommande confirmée après paiement · Livraison dès disponibilité du stock · En cas de retard important, remboursement possible
                </p>
              </div>
            )}

            {/* ═══ ACHAT NORMAL ═══ */}
            {!isPreorder && (
              <>
                {/* Sélecteur quantité + Ajouter au panier */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex items-center border border-border rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQty(Math.max(1, qty - 1))}
                      className="h-12 w-12 hover:bg-muted"
                    >
                      <Minus className="h-4 w-4 mx-auto" />
                    </button>
                    <span className="px-4 font-bold w-12 text-center">{qty}</span>
                    <button
                      onClick={() => setQty(qty + 1)}
                      className="h-12 w-12 hover:bg-muted"
                    >
                      <Plus className="h-4 w-4 mx-auto" />
                    </button>
                  </div>
                  <Button
                    size="lg"
                    className="flex-1 h-12 bg-gradient-cta hover:opacity-90 shadow-warm font-semibold"
                    onClick={() => {
                      add({
                        id: p.id, slug: p.slug,
                        name: activeOption ? `${p.name} — ${activeOption.name}` : p.name,
                        price_xaf: basePrice,
                        image_url: p.image_url,
                        selectedOptionName: activeOption?.name,
                        optionId: activeOption?.id,
                      }, qty);
                      toast.success(t("pd.added"));
                    }}
                  >
                    {t("pd.add_cart")}
                  </Button>
                </div>

                {/* Commander */}
                <div className="flex gap-2">
                  <Button
                    size="lg"
                    className="flex-1 h-12 bg-foreground text-background hover:bg-foreground/90 font-bold"
                    onClick={handleBuyNow}
                  >
                    Commander
                  </Button>
                </div>
              </>
            )}

            {/* Badges de confiance */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-border">
              <div className="text-center"><ShieldCheck className="h-5 w-5 text-success mx-auto mb-1" /><p className="text-xs font-medium">{t("trust.secure")}</p></div>
              <div className="text-center"><Truck className="h-5 w-5 text-primary mx-auto mb-1" /><p className="text-xs font-medium">{t("trust.fast")}</p></div>
              <div className="text-center"><RefreshCw className="h-5 w-5 text-secondary mx-auto mb-1" /><p className="text-xs font-medium">{t("pd.return_7d")}</p></div>
            </div>
          </div>
        </div>

        {/* BENEFITS */}
        {benefits.length > 0 && (
          <section className="mt-12">
            <div className="text-center mb-8">
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles className="h-3 w-3" /> {t("pd.benefits.kicker")}
              </span>
              <h2 className="text-2xl md:text-3xl font-extrabold mt-2">{t("pd.benefits.title")}</h2>
              <p className="text-sm text-muted-foreground mt-1">{t("pd.benefits.subtitle")}</p>
            </div>
            <div className="rounded-3xl overflow-hidden bg-foreground text-background shadow-card mb-4 grid md:grid-cols-2">
              <div className="aspect-square md:aspect-auto bg-muted">
                <img src={resolveImg(benefitImages[0] || gallery[1] || gallery[0])} alt={benefits[0]} className="w-full h-full object-cover" />
              </div>
              <div className="p-6 md:p-10 flex flex-col justify-center">
                <span className="text-xs font-bold uppercase tracking-wider text-accent mb-2">{t("pd.benefits.adv1")}</span>
                <p className="text-2xl md:text-3xl font-extrabold leading-tight mb-3">{benefits[0]}</p>
                <p className="text-sm text-background/70">{t("pd.benefits.adv1_sub")}</p>
              </div>
            </div>
            {benefits.length > 1 && (
              <div className="grid grid-cols-2 gap-3 md:gap-4">
                {benefits.slice(1).map((b, i) => (
                  <div key={i} className="rounded-2xl overflow-hidden bg-foreground text-background shadow-soft relative aspect-square cursor-pointer" onClick={() => setLightboxImg(resolveImg(benefitImages[i + 1] || gallery[(i + 2) % Math.max(gallery.length, 1)] || gallery[0]))}>
                    <img
                      src={resolveImg(benefitImages[i + 1] || gallery[(i + 2) % Math.max(gallery.length, 1)] || gallery[0])}
                      alt={b}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-accent mb-1">
                        <CheckCircle2 className="h-3 w-3" /> {t("pd.benefits.atout")}
                      </span>
                      <p className="text-sm md:text-base font-bold leading-tight">{b}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* LIGHTBOX atout */}
        {lightboxImg && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setLightboxImg(null)}>
            <button className="absolute top-4 right-4 text-white/80 hover:text-white text-3xl font-bold leading-none" onClick={() => setLightboxImg(null)}>✕</button>
            <img src={lightboxImg} alt="atout" className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl" onClick={e => e.stopPropagation()} />
          </div>
        )}

        {/* VIDEO */}
        {p.video_url && (
          <section className="mt-10">
            <h2 className="text-xl md:text-2xl font-bold mb-4">{t("pd.video_title")}</h2>
            <div className="aspect-video rounded-3xl overflow-hidden shadow-card bg-black">
              {isYoutube ? (
                <iframe
                  src={youtubeEmbedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  title="Vidéo produit"
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              ) : (
                <video src={p.video_url} controls className="w-full h-full object-cover" />
              )}
            </div>
          </section>
        )}

        {/* ✅ SECTION DÉTAILS — longue description AVANT les specs techniques */}
        <section className="mt-12">
          <Accordion type="multiple" className="space-y-3">

            {/* Description — toujours visible si description ou long_description */}
            {(longDescription || shortDescription) && (
              <AccordionItem value="long-desc" className="bg-card rounded-2xl border border-border/50 shadow-soft px-5 md:px-6">
                <AccordionTrigger className="text-lg md:text-xl font-extrabold py-4 hover:no-underline">
                  Description du produit
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/80">
                    {longDescription || shortDescription}
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}

            {/* Spécifications techniques */}
            <AccordionItem value="specs" className="bg-card rounded-2xl border border-border/50 shadow-soft px-5 md:px-6">
              <AccordionTrigger className="text-lg md:text-xl font-extrabold py-4 hover:no-underline">
                {t("pd.specs_title")}
              </AccordionTrigger>
              <AccordionContent>
                {specsText.length === 0 && specsImages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("pd.specs_empty")}</p>
                ) : (
                  <div className="space-y-6">
                    {specsText.length > 0 && (
                      <dl className="grid sm:grid-cols-2 gap-x-8">
                        {specsText.map(([k, v]) => (
                          <div key={k} className="flex justify-between gap-4 py-2.5 border-b border-border last:border-0 text-sm">
                            <dt className="text-muted-foreground">{k}</dt>
                            <dd className="font-semibold text-right">{v}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                    {specsImages.length > 0 && (
                      <div className="flex flex-col gap-3">
                        {specsImages.map(([k, v]) => (
                          <figure key={k} className="rounded-2xl overflow-hidden bg-muted">
                            <img src={resolveImg(String(v))} alt={k} loading="lazy" className="w-full h-auto object-cover" />
                            <figcaption className="px-4 py-2 text-xs text-muted-foreground bg-card border-t border-border">{k}</figcaption>
                          </figure>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            {/* Contenu de la boîte */}
            <AccordionItem value="box" className="bg-card rounded-2xl border border-border/50 shadow-soft px-5 md:px-6">
              <AccordionTrigger className="text-lg md:text-xl font-extrabold py-4 hover:no-underline">
                {t("pd.box_title")}
              </AccordionTrigger>
              <AccordionContent>
                {box.length > 0 ? (
                  <ul className="grid sm:grid-cols-2 gap-2">
                    {box.map((b, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm py-1">
                        <Package2 className="h-4 w-4 text-primary shrink-0" /> {b}
                      </li>
                    ))}
                  </ul>
                ) : <p className="text-sm text-muted-foreground">{t("pd.box_empty")}</p>}
              </AccordionContent>
            </AccordionItem>

            {/* Infos supplémentaires */}
            <AccordionItem value="extra" className="bg-card rounded-2xl border border-border/50 shadow-soft px-5 md:px-6">
              <AccordionTrigger className="text-lg md:text-xl font-extrabold py-4 hover:no-underline">
                {t("pd.extra_title")}
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm leading-relaxed whitespace-pre-line text-foreground/80">
                  {p.extra_details || t("pd.extra_default")}
                </p>
              </AccordionContent>
            </AccordionItem>

            {/* Manuels & Fichiers */}
            <AccordionItem value="manuals" className="bg-card rounded-2xl border border-border/50 shadow-soft px-5 md:px-6">
              <AccordionTrigger className="text-lg md:text-xl font-extrabold py-4 hover:no-underline">
                <span className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Manuels & Fichiers
                </span>
              </AccordionTrigger>
              <AccordionContent>
                {manuals.length > 0 ? (
                  <ul className="space-y-2">
                    {manuals.map((url, i) => {
                      const filename = url.split("/").pop() || `Fichier ${i + 1}`;
                      return (
                        <li key={i}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="flex items-center gap-3 p-3 rounded-xl bg-muted hover:bg-muted/80 text-sm font-medium transition-smooth"
                          >
                            <Download className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate">{filename}</span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p>Les manuels et guides d'utilisation seront disponibles prochainement.</p>
                    <a
                      href={`mailto:bonjour@skyridestore.fr?subject=${encodeURIComponent(`Manuel du ${p.name}`)}`}
                      className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-xl bg-success text-success-foreground text-xs font-semibold hover:opacity-90"
                    >
                      <MessageCircle className="h-4 w-4" /> Demander le manuel
                    </a>
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* REVIEWS */}
        <section className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-bold">Avis clients ({reviews.length})</h2>
            {reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <StarRow value={Math.round(avgRating)} />
                <span className="font-bold">{avgRating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-5 mb-6">
            <h3 className="font-bold mb-4">Laisser un avis</h3>
            {user ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Votre note</p>
                  <StarRow value={reviewRating} onChange={setReviewRating} />
                </div>
                <textarea
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  placeholder="Partagez votre expérience avec ce produit..."
                  rows={3}
                  className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm outline-none focus:border-primary resize-none"
                />
                <Button
                  onClick={submitReview}
                  disabled={submittingReview || !reviewComment.trim()}
                  className="w-full h-11 bg-gradient-cta font-semibold"
                >
                  {submittingReview ? "Envoi…" : "Publier mon avis"}
                </Button>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground mb-3">Vous devez être connecté pour laisser un avis.</p>
                <Button asChild variant="outline">
                  <Link to="/auth">Se connecter / S'inscrire</Link>
                </Button>
              </div>
            )}
          </div>

          {reviewsLoaded && reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Aucun avis pour l'instant. Soyez le premier !</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <p className="font-semibold text-sm">{(r.profiles as any)?.full_name || "Client vérifié"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                    <StarRow value={r.rating} />
                  </div>
                  <p className="text-sm text-foreground/80 leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Produits liés */}
        {related.filter((r: any) => r.id !== p.id).length > 0 && (
          <section className="mt-16">
            <h2 className="text-xl md:text-2xl font-bold mb-5">{t("pd.related")}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
              {related.filter((r: any) => r.id !== p.id).slice(0, 4).map((r: any) => (
                <ProductCard key={r.id} product={r} />
              ))}
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
