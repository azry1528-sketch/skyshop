import { useEffect, useState, useRef, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Header from "@/components/jangolo/Header";
import Footer from "@/components/jangolo/Footer";
import ProductCard from "@/components/jangolo/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/components/jangolo/ProductCard";
import { Search as SearchIcon, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/contexts/I18nContext";

const PAGE_SIZE = 12;

type Suggestion = { id: string; name: string; slug: string };

const SearchPage = () => {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const q = params.get("q") || "";
  const [input, setInput] = useState(q);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const sentinel = useRef<HTMLDivElement>(null);
  const seenIds = useRef<Set<string>>(new Set());

  const loadMore = useCallback(async (reset = false) => {
    if (!q || loading || (done && !reset)) return;
    setLoading(true); setError(null);
    const currentPage = reset ? 0 : page;
    const from = currentPage * PAGE_SIZE;
    const { data, error: err } = await supabase
      .from("products")
      .select("*")
      .or(`name.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`)
      .order("created_at", { ascending: false })
      .range(from, from + PAGE_SIZE - 1);
    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }
    const incoming = (data as Product[]) || [];
    const fresh = incoming.filter(p => !seenIds.current.has(p.id));
    fresh.forEach(p => seenIds.current.add(p.id));
    setResults(prev => reset ? fresh : [...prev, ...fresh]);
    setPage(currentPage + 1);
    setDone(incoming.length < PAGE_SIZE);
    setLoading(false);
  }, [q, page, loading, done]);

  // reset on query change
  useEffect(() => {
    seenIds.current = new Set();
    setResults([]); setPage(0); setDone(false); setError(null);
    if (q) loadMore(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  // live suggestions on input
  useEffect(() => {
    const term = input.trim();
    if (term.length < 2 || term === q) { setSuggestions([]); return; }
    const h = setTimeout(async () => {
      const { data } = await supabase.from("products").select("id,name,slug").ilike("name", `%${term}%`).limit(5);
      setSuggestions((data as Suggestion[]) || []);
    }, 220);
    return () => clearTimeout(h);
  }, [input, q]);

  useEffect(() => {
    if (!sentinel.current) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) loadMore();
    }, { rootMargin: "200px" });
    obs.observe(sentinel.current);
    return () => obs.disconnect();
  }, [loadMore]);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 md:py-10">
        <form onSubmit={(e) => { e.preventDefault(); setSuggestions([]); setParams({ q: input }); }} className="relative">
          <div className="flex items-center gap-2 bg-card border border-border rounded-2xl px-4 py-3 shadow-soft">
            <SearchIcon className="h-5 w-5 text-muted-foreground" />
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t("search.placeholder")} className="flex-1 bg-transparent outline-none text-sm" autoFocus />
            <button type="submit" className="text-sm font-semibold text-primary px-3">{t("search.button")}</button>
          </div>
          {suggestions.length > 0 && (
            <div className="absolute z-20 left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-soft overflow-hidden">
              {suggestions.map(s => (
                <Link key={s.id} to={`/product/${s.slug}`} onClick={() => setSuggestions([])} className="block px-4 py-2.5 text-sm hover:bg-muted border-t border-border first:border-0">
                  {s.name}
                </Link>
              ))}
            </div>
          )}
        </form>

        <div className="mt-6">
          {!q ? (
            <p className="text-center text-muted-foreground py-12">{t("search.empty")}</p>
          ) : error ? (
            <div className="text-center py-12">
              <AlertTriangle className="h-10 w-10 mx-auto text-destructive mb-3" />
              <p className="text-sm text-muted-foreground mb-4">{t("search.error")}</p>
              <Button onClick={() => loadMore(true)} variant="outline">{t("search.retry")}</Button>
            </div>
          ) : results.length === 0 && !loading ? (
            <p className="text-center text-muted-foreground py-12">{t("search.no_results")} « {q} ».</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">{results.length} {t("search.results_for")} « <span className="font-semibold text-foreground">{q}</span> »</p>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                {results.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              <div ref={sentinel} className="py-8 text-center text-sm text-muted-foreground">
                {loading ? t("search.loading") : done && results.length > 0 ? t("search.all_shown") : ""}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchPage;
