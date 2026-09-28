import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Wallet, Search, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProductCard from "@/components/jangolo/ProductCard";
import type { Product } from "@/components/jangolo/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { formatEUR, whatsappLink } from "@/lib/jangolo";

const QUICK_BUDGETS = [100, 300, 500, 1000, 2000, 3000];

const BudgetRecommender = () => {
  const [input, setInput] = useState("");
  const [budget, setBudget] = useState<number | null>(null);

  const { data: results = [], isFetching, isError } = useQuery({
    queryKey: ["budget-products", budget],
    enabled: budget !== null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .lte("price_xaf", budget!)
        .gt("stock", 0)
        .order("price_xaf", { ascending: false }) // les plus proches du budget en premier
        .limit(12);
      if (error) throw error;
      return data as Product[];
    },
  });

  const submit = (value?: number) => {
    const n = value ?? Number(input.replace(",", "."));
    if (!Number.isFinite(n) || n <= 0) return;
    setInput(String(n));
    setBudget(Math.round(n));
  };

  return (
    <section id="budget" className="container py-6 md:py-10">
      <div className="rounded-3xl border border-border/50 bg-card shadow-soft p-5 md:p-8">
        <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-2">
          <Wallet className="h-4 w-4" /> Recommandation selon votre budget
        </div>
        <h2 className="text-2xl md:text-3xl font-bold">Quel est votre budget ?</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Indiquez le montant que vous souhaitez dépenser, nous vous montrons les articles qui y correspondent.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); submit(); }}
          className="mt-5 flex flex-col sm:flex-row gap-3 max-w-xl"
        >
          <div className="relative flex-1">
            <Input
              type="number"
              inputMode="decimal"
              min={1}
              step="any"
              placeholder="Ex : 800"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="h-11 pr-10"
              aria-label="Votre budget en euros"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">€</span>
          </div>
          <Button type="submit" className="h-11 bg-gradient-cta hover:opacity-90 shadow-warm font-semibold">
            <Search className="h-4 w-4 mr-2" /> Voir les articles
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_BUDGETS.map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => submit(b)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-smooth ${
                budget === b ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
              }`}
            >
              {formatEUR(b)}
            </button>
          ))}
        </div>

        {budget !== null && (
          <div className="mt-6">
            {isFetching ? (
              <p className="text-sm text-muted-foreground">Recherche en cours…</p>
            ) : isError ? (
              <p className="text-sm text-destructive">Impossible de charger les articles pour le moment. Réessayez.</p>
            ) : results.length > 0 ? (
              <>
                <p className="text-sm font-semibold mb-4">
                  {results.length} article{results.length > 1 ? "s" : ""} pour un budget de {formatEUR(budget)} maximum
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-5">
                  {results.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              </>
            ) : (
              <div className="rounded-2xl bg-muted p-5 text-sm">
                <p className="font-semibold">Aucun article disponible à {formatEUR(budget)} ou moins.</p>
                <p className="text-muted-foreground mt-1">Essayez un budget plus élevé, ou contactez-nous pour trouver une solution.</p>
                <Button asChild variant="outline" size="sm" className="mt-3">
                  <a
                    href={whatsappLink(`Bonjour, mon budget est de ${budget} €. Que me conseillez-vous ?`)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <MessageCircle className="h-4 w-4 mr-2" /> Nous écrire sur WhatsApp
                  </a>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default BudgetRecommender;
