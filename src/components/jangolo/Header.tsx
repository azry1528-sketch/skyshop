import { Link, NavLink, useNavigate } from "react-router-dom";
import { ShoppingBag, Menu, Search, Facebook, Instagram, Youtube, X, LayoutGrid, Home, Info, Phone, Music2, Package, ChevronDown, User, Globe, Moon, Sun } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/contexts/CartContext";
import { CATEGORY_TREE, BRAND, SOCIALS } from "@/lib/jangolo";
import { useI18n } from "@/contexts/I18nContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import MobileCategoryItem from "./MobileCategoryItem";
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type Suggestion = { id: string; name: string; slug: string; category: string };

const HERO_IMG = "https://images.unsplash.com/photo-1604868189265-219ba7a3c6a5?w=1920&q=80";

const Header = () => {
  const { count } = useCart();
  const { user } = useAuth();
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSug, setLoadingSug] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Theme toggle
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    return (localStorage.getItem("skyride:theme") as "light" | "dark") || "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("skyride:theme", theme);
  }, [theme]);

  useEffect(() => { if (searchOpen) setTimeout(() => inputRef.current?.focus(), 50); }, [searchOpen]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setSuggestions([]); return; }
    // Sur desktop searchOpen est false mais la barre est visible — on cherche quand même
    if (!searchOpen && window.innerWidth < 1024) return;
    setLoadingSug(true);
    const handle = setTimeout(async () => {
      const { data } = await supabase
        .from("products")
        .select("id,name,slug,category")
        .or(`name.ilike.%${term}%,category.ilike.%${term}%`)
        .limit(6);
      setSuggestions((data as Suggestion[]) || []);
      setLoadingSug(false);
    }, 220);
    return () => clearTimeout(handle);
  }, [q, searchOpen]);

  const goSearch = (term: string) => {
    if (!term.trim()) return;
    setSearchOpen(false);
    setSuggestions([]);
    navigate(`/search?q=${encodeURIComponent(term.trim())}`);
  };

  const onSubmit = (e: React.FormEvent) => { e.preventDefault(); goSearch(q); };

  return (
    <header className="sticky top-0 z-40">

      {/* DESKTOP HEADER */}
      <div
        className="hidden lg:block relative"
        style={{
          backgroundImage: `url('${HERO_IMG}')`,
          backgroundSize: "cover",
          backgroundPosition: "center center",
        }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative container flex items-center justify-between h-20 gap-4">

          {/* Logo + barre de recherche inline à gauche */}
          <div className="flex items-center gap-4 z-10 shrink-0">
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-extrabold shadow-lg text-lg">S</div>
              <span className="text-xl font-extrabold tracking-tight text-white drop-shadow">{BRAND}</span>
            </Link>

            {/* Barre de recherche à côté du logo */}
            <form
              onSubmit={onSubmit}
              className="flex items-center bg-white/10 border border-white/20 rounded-full px-3 py-1.5 gap-2 w-52 hover:bg-white/20 transition-all focus-within:bg-white/20 focus-within:border-white/40"
            >
              <Search className="h-4 w-4 text-white/60 shrink-0" />
              <input
                ref={inputRef}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Rechercher..."
                className="bg-transparent outline-none text-sm text-white placeholder:text-white/50 w-full"
              />
              {q && (
                <button type="button" onClick={() => setQ("")} className="text-white/50 hover:text-white">
                  <X className="h-3 w-3" />
                </button>
              )}
            </form>
          </div>

          {/* Nav centré */}
          <nav className="flex items-center gap-6 absolute left-1/2 -translate-x-1/2">
            {CATEGORY_TREE.map((c) => (
              c.children ? (
                <div key={c.slug} className="relative group">
                  <NavLink to={`/category/${c.slug}`} className={({ isActive }) => `text-sm font-semibold hover:text-accent inline-flex items-center gap-1 text-white drop-shadow ${isActive ? "text-accent" : ""}`}>
                    {c.label} <ChevronDown className="h-3 w-3" />
                  </NavLink>
                  <div className="absolute left-1/2 -translate-x-1/2 top-full pt-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="bg-card border border-border rounded-xl shadow-warm py-2 min-w-[200px]">
                      {c.children.map((s) => (
                        <Link key={s.slug} to={`/category/${s.slug}`} className="block px-4 py-2 text-sm hover:bg-muted hover:text-primary">
                          {s.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <NavLink key={c.slug} to={`/category/${c.slug}`} className={({ isActive }) => `text-sm font-semibold hover:text-accent text-white drop-shadow ${isActive ? "text-accent" : ""}`}>{c.label}</NavLink>
              )
            ))}
          </nav>

          {/* Icônes à droite */}
          <div className="flex items-center gap-1 z-10">
            <Link to="/suivi" className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-primary/90 text-white hover:bg-primary transition-smooth border border-primary/40 shadow-sm" aria-label={t("nav.track")}>
              <Package className="h-3.5 w-3.5" /> {t("nav.track")}
            </Link>

            {/* 🌐 Bouton traduction — AVANT connexion */}
            <button
              onClick={() => setLang(lang === "fr" ? "en" : "fr")}
              className="flex items-center gap-1 ml-1 px-2.5 py-1.5 rounded-full text-white hover:bg-white/20 text-xs font-bold uppercase transition-smooth border border-white/20"
              aria-label={t("lang.label")}
            >
              <Globe className="h-3.5 w-3.5" />
              {lang === "fr" ? "FR" : "EN"}
            </button>

            {/* 🌙 Bouton thème */}
            <button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="p-2 text-white hover:bg-white/20 rounded-full transition-smooth"
              aria-label="Changer de thème"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* 👤 Connexion */}
            <Link to={user ? "/account" : "/auth"} className="p-2 hover:text-accent text-white hidden sm:inline-flex" aria-label={user ? t("nav.my_account") : t("nav.signin")}>
              <User className="h-5 w-5" />
            </Link>

            {/* 🛒 Panier */}
            <Link to="/checkout" className="relative p-2 hover:text-accent text-white" aria-label="Panier">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-white text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">{count}</span>
              )}
            </Link>
          </div>
        </div>

        {/* Suggestions dropdown POPUP sous la searchbar — desktop uniquement */}
        {q.trim().length >= 2 && (
          <div className="absolute top-full left-0 right-0 z-50">
            <div className="container pt-2 pb-4">
              <div className="bg-card border border-border rounded-xl shadow-warm overflow-hidden max-w-sm"
                style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.18)" }}
              >
                {loadingSug ? (
                  <p className="px-4 py-3 text-xs text-muted-foreground">{t("search.loading")}</p>
                ) : suggestions.length === 0 ? (
                  <p className="px-4 py-3 text-xs text-muted-foreground">{t("search.no_results")} « {q} »</p>
                ) : (
                  <>
                    {suggestions.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setQ(""); setSuggestions([]); navigate(`/product/${s.slug}`); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm flex items-center justify-between gap-2 border-t border-border first:border-0"
                      >
                        <span className="truncate font-medium">{s.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{s.category}</span>
                      </button>
                    ))}
                    <button onClick={() => goSearch(q)} className="w-full px-4 py-2.5 text-xs font-semibold text-primary hover:bg-muted border-t border-border">
                      {t("search.button")} « {q} » →
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MOBILE HEADER */}
      <div className="lg:hidden bg-background/95 backdrop-blur border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <button className="p-2 -ml-2 text-foreground" aria-label="Menu">
                <Menu className="h-6 w-6" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[72vw] max-w-[300px] p-0 flex flex-col">
              <SheetHeader className="px-5 py-4 border-b border-border">
                <SheetTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-extrabold">S</div>
                  {BRAND}
                </SheetTitle>
              </SheetHeader>
              <nav className="flex-1 overflow-y-auto px-3 py-3">
                {[
                  { to: "/", icon: Home, label: t("nav.home") },
                  { to: "/categories", icon: LayoutGrid, label: t("nav.categories") },
                ].map((l) => (
                  <Link key={l.to} to={l.to} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-muted text-sm font-semibold">
                    <l.icon className="h-5 w-5 text-primary" /> {l.label}
                  </Link>
                ))}
                <p className="px-3 mt-3 mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("nav.cats_title")}</p>
                {CATEGORY_TREE.map((c) => (
                  <MobileCategoryItem key={c.slug} cat={c} onNavigate={() => setMenuOpen(false)} />
                ))}
                <p className="px-3 mt-3 mb-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{t("nav.about_title")}</p>
                <Link to="/suivi" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-sm"><Package className="h-4 w-4 text-primary" /> {t("nav.track")}</Link>
                <Link to={user ? "/account" : "/auth"} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-sm"><User className="h-4 w-4 text-primary" /> {user ? t("nav.my_account") : t("nav.signin")}</Link>
                <Link to="/about" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-sm"><Info className="h-4 w-4 text-primary" /> {t("nav.about")}</Link>
                <Link to="/contact" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted text-sm"><Phone className="h-4 w-4 text-primary" /> {t("nav.contact")}</Link>
              </nav>
              <div className="px-5 py-4 border-t border-border">
                <p className="text-xs font-semibold mb-3 text-muted-foreground">{t("nav.follow")}</p>
                <div className="flex gap-2">
                  <a href={SOCIALS.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="h-10 w-10 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-smooth"><Facebook className="h-4 w-4" /></a>
                  <a href={SOCIALS.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="h-10 w-10 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-smooth"><Instagram className="h-4 w-4" /></a>
                  <a href={SOCIALS.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok" className="h-10 w-10 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-smooth"><Music2 className="h-4 w-4" /></a>
                  <a href={SOCIALS.youtube} target="_blank" rel="noreferrer" aria-label="YouTube" className="h-10 w-10 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-smooth"><Youtube className="h-4 w-4" /></a>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center text-white font-extrabold shadow-warm">S</div>
            <span className="text-xl font-extrabold tracking-tight">{BRAND}</span>
          </Link>

          <div className="flex items-center gap-1">
            <button onClick={() => setSearchOpen(!searchOpen)} className="p-2 hover:text-primary" aria-label="Recherche"><Search className="h-5 w-5" /></button>
            <button
              onClick={() => setLang(lang === "fr" ? "en" : "fr")}
              className="flex items-center gap-0.5 p-2 hover:text-primary text-xs font-bold uppercase"
              aria-label={t("lang.label")}
            >
              <Globe className="h-4 w-4" />
              {lang === "fr" ? "FR" : "EN"}
            </button>
            <Link to={user ? "/account" : "/auth"} className="p-2 hover:text-primary hidden sm:inline-flex" aria-label={user ? t("nav.my_account") : t("nav.signin")}><User className="h-5 w-5" /></Link>
            <Link to="/checkout" className="relative p-2 hover:text-primary" aria-label="Panier">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">{count}</span>
              )}
            </Link>
          </div>
        </div>

        {searchOpen && (
          <div className="border-t border-border bg-background">
            <form onSubmit={onSubmit} className="container py-3 flex items-center gap-2">
              <Search className="h-5 w-5 text-muted-foreground" />
              <input
                ref={inputRef}
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder={t("search.placeholder")}
                className="flex-1 bg-transparent outline-none text-sm py-2"
              />
              <button type="button" onClick={() => { setSearchOpen(false); setSuggestions([]); }} aria-label="Fermer" className="p-2 hover:text-primary"><X className="h-4 w-4" /></button>
            </form>
            {q.trim().length >= 2 && (
              <div className="container pb-3">
                <div className="bg-card border border-border rounded-xl shadow-soft overflow-hidden">
                  {loadingSug ? (
                    <p className="px-4 py-3 text-xs text-muted-foreground">{t("search.loading")}</p>
                  ) : suggestions.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-muted-foreground">{t("search.no_results")} « {q} »</p>
                  ) : (
                    <>
                      {suggestions.map(s => (
                        <button
                          key={s.id}
                          onClick={() => { setSearchOpen(false); setSuggestions([]); navigate(`/product/${s.slug}`); }}
                          className="w-full text-left px-4 py-2.5 hover:bg-muted text-sm flex items-center justify-between gap-2 border-t border-border first:border-0"
                        >
                          <span className="truncate font-medium">{s.name}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0">{s.category}</span>
                        </button>
                      ))}
                      <button onClick={() => goSearch(q)} className="w-full px-4 py-2.5 text-xs font-semibold text-primary hover:bg-muted border-t border-border">
                        {t("search.button")} « {q} » →
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
