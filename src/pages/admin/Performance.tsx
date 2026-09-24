import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatEUR } from "@/lib/jangolo";
import { TrendingUp, Target, Award, AlertTriangle, CheckCircle, Clock, XCircle } from "lucide-react";

const Performance = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: ords }, { data: prods }] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("*"),
      ]);
      setOrders(ords || []);
      setProducts(prods || []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="text-muted-foreground text-sm">Chargement…</div>;

  const delivered = orders.filter(o => o.status === "delivered");
  const cancelled = orders.filter(o => o.status === "cancelled");
  const pending = orders.filter(o => o.status === "pending");
  const shipped = orders.filter(o => o.status === "shipped" || o.status === "confirmed");

  const revenue = delivered.reduce((s, o) => s + (o.total_xaf || 0), 0);
  const deliveryRate = orders.length > 0 ? Math.round((delivered.length / orders.length) * 100) : 0;
  const cancelRate = orders.length > 0 ? Math.round((cancelled.length / orders.length) * 100) : 0;

  // Average order value (delivered only)
  const avgOrder = delivered.length > 0 ? Math.round(revenue / delivered.length) : 0;

  // Monthly revenue (last 6 months)
  const monthly: Record<string, number> = {};
  const monthlyOrders: Record<string, number> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    monthly[key] = 0;
    monthlyOrders[key] = 0;
  }
  delivered.forEach(o => {
    const d = new Date(o.created_at);
    const now = new Date();
    const diffMonths = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
    if (diffMonths <= 5) {
      const key = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
      if (monthly[key] !== undefined) {
        monthly[key] += o.total_xaf || 0;
        monthlyOrders[key]++;
      }
    }
  });

  const maxRevenue = Math.max(...Object.values(monthly), 1);

  // Top selling products
  const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
  delivered.forEach(o => {
    (o.items as any[])?.forEach((item: any) => {
      const key = item.name;
      if (!productSales[key]) productSales[key] = { name: item.name, qty: 0, revenue: 0 };
      productSales[key].qty += item.qty || 1;
      productSales[key].revenue += (item.price_xaf || 0) * (item.qty || 1);
    });
  });
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Low stock products
  const lowStock = products.filter(p => p.stock <= 5).sort((a, b) => a.stock - b.stock);

  // KPI score (simple health check)
  const kpiScore = Math.min(100, Math.round(
    (deliveryRate * 0.5) +
    ((100 - cancelRate) * 0.3) +
    (products.filter(p => p.gallery_urls?.length && p.benefits?.length).length / Math.max(products.length, 1) * 100 * 0.2)
  ));

  const kpiColor = kpiScore >= 80 ? "text-success" : kpiScore >= 60 ? "text-accent-foreground" : "text-destructive";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Performances</h1>
        <p className="text-muted-foreground text-sm">Indicateurs clés de votre boutique.</p>
      </div>

      {/* Score global */}
      <div className="bg-card rounded-2xl p-6 shadow-soft border border-border/50 flex items-center gap-6">
        <div className={`text-6xl font-extrabold ${kpiColor}`}>{kpiScore}<span className="text-2xl">/100</span></div>
        <div>
          <p className="font-bold text-lg">Score de performance global</p>
          <p className="text-muted-foreground text-sm">Basé sur le taux de livraison, d'annulation et la qualité des fiches produit.</p>
          <div className="mt-2 h-3 w-48 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${kpiScore >= 80 ? "bg-success" : kpiScore >= 60 ? "bg-accent" : "bg-destructive"}`}
              style={{ width: `${kpiScore}%` }}
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: CheckCircle, label: "Taux livraison", value: `${deliveryRate}%`, sub: `${delivered.length} livrées`, color: "bg-success/15 text-success" },
          { icon: XCircle, label: "Taux annulation", value: `${cancelRate}%`, sub: `${cancelled.length} annulées`, color: "bg-destructive/15 text-destructive" },
          { icon: Target, label: "Panier moyen", value: formatEUR(avgOrder), sub: "sur livraisons", color: "bg-primary/15 text-primary" },
          { icon: Clock, label: "En cours", value: pending.length + shipped.length, sub: `${pending.length} en attente`, color: "bg-accent/30 text-accent-foreground" },
        ].map(c => (
          <div key={c.label} className="bg-card rounded-2xl p-5 shadow-soft border border-border/50">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{c.label}</span>
              <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${c.color}`}><c.icon className="h-4 w-4" /></span>
            </div>
            <p className="text-2xl font-extrabold">{c.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      {/* Revenue chart (monthly) */}
      <div className="bg-card rounded-2xl p-5 shadow-soft border border-border/50">
        <h2 className="font-bold mb-1">Chiffre d'affaires mensuel <span className="text-xs text-muted-foreground font-normal">(commandes livrées uniquement)</span></h2>
        <p className="text-2xl font-extrabold text-success mb-4">{formatEUR(revenue)} <span className="text-sm font-normal text-muted-foreground">total cumulé</span></p>
        <div className="flex items-end gap-3 h-40">
          {Object.entries(monthly).map(([month, rev]) => (
            <div key={month} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-semibold text-foreground">{rev > 0 ? formatEUR(rev).replace("€", "").trim() : ""}</span>
              <div
                className="w-full rounded-t-lg bg-gradient-cta transition-all"
                style={{ height: `${Math.max((rev / maxRevenue) * 100, rev > 0 ? 8 : 2)}%`, opacity: rev > 0 ? 1 : 0.2 }}
              />
              <span className="text-[10px] text-muted-foreground capitalize">{month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Top products */}
        <div className="bg-card rounded-2xl p-5 shadow-soft border border-border/50">
          <h2 className="font-bold mb-4 flex items-center gap-2"><Award className="h-4 w-4 text-primary" /> Top produits vendus</h2>
          <div className="space-y-3">
            {topProducts.length === 0 && <p className="text-sm text-muted-foreground">Aucune vente livrée.</p>}
            {topProducts.map((p, i) => (
              <div key={p.name} className="flex items-center gap-3 text-sm">
                <span className="h-6 w-6 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.qty} unité{p.qty > 1 ? "s" : ""} vendues</p>
                </div>
                <span className="font-bold text-success text-xs shrink-0">{formatEUR(p.revenue)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Low stock alert */}
        <div className="bg-card rounded-2xl p-5 shadow-soft border border-border/50">
          <h2 className="font-bold mb-4 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Stock faible (≤ 5)</h2>
          <div className="space-y-2">
            {lowStock.length === 0 && <p className="text-sm text-success flex items-center gap-2"><CheckCircle className="h-4 w-4" /> Tous les produits sont bien approvisionnés.</p>}
            {lowStock.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-destructive/5 border border-destructive/20 rounded-xl px-3 py-2 text-sm">
                <p className="font-semibold truncate">{p.name}</p>
                <span className={`font-bold ${p.stock === 0 ? "text-destructive" : "text-accent-foreground"}`}>
                  {p.stock === 0 ? "Épuisé" : `${p.stock} restant${p.stock > 1 ? "s" : ""}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Order status breakdown */}
        <div className="bg-card rounded-2xl p-5 shadow-soft border border-border/50 lg:col-span-2">
          <h2 className="font-bold mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Répartition des statuts</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "En attente", count: pending.length, color: "bg-accent/20 text-accent-foreground border-accent/30" },
              { label: "Confirmé", count: orders.filter(o => o.status === "confirmed").length, color: "bg-primary/10 text-primary border-primary/20" },
              { label: "Expédié", count: orders.filter(o => o.status === "shipped").length, color: "bg-secondary/20 text-secondary border-secondary/30" },
              { label: "Livré", count: delivered.length, color: "bg-success/10 text-success border-success/20" },
              { label: "Annulé", count: cancelled.length, color: "bg-destructive/10 text-destructive border-destructive/20" },
            ].map(s => (
              <div key={s.label} className={`rounded-xl border p-4 text-center ${s.color}`}>
                <p className="text-2xl font-extrabold">{s.count}</p>
                <p className="text-xs font-semibold mt-1">{s.label}</p>
                <p className="text-[10px] opacity-70">{orders.length > 0 ? Math.round((s.count / orders.length) * 100) : 0}%</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Performance;
