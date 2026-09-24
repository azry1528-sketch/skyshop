import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/jangolo/Header";
import Footer from "@/components/jangolo/Footer";
import ProductCard from "@/components/jangolo/ProductCard";
import { Tag, Loader2 } from "lucide-react";
import { useI18n } from "@/contexts/I18nContext";

const Promotions = () => {
  const { t } = useI18n();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("products")
      .select("*")
      .eq("is_promo", true)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setProducts(data || []);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container py-8 flex-1 pb-24 md:pb-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-12 w-12 rounded-2xl bg-gradient-cta text-primary-foreground flex items-center justify-center shadow-warm">
            <Tag className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold">{t("promo.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("promo.subtitle")}</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : error ? (
          <p className="text-center py-20 text-destructive">{error}</p>
        ) : products.length === 0 ? (
          <p className="text-center py-20 text-muted-foreground">{t("promo.empty")}</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Promotions;
