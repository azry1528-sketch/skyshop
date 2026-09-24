import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatEUR } from "@/lib/jangolo";
import { ShoppingCart, Package, TrendingUp, Wallet } from "lucide-react";

const Card = ({ icon: Icon, label, value, color, note }: any) => (
  <div className="bg-card rounded-2xl p-5 shadow-soft border border-border/50">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</span>
      <span className={`h-9 w-9 rounded-xl flex items-center justify-center ${color}`}><Icon className="h-4 w-4" /></span>
    </div>
    <p className="text-2xl md:text-3xl font-extrabold">{value}</p>
    {note && <p className="text-[10px] text-muted-foreground mt-1">{note}</p>}
  </div>
);

const Dashboard = () => {
  const [stats, setStats] = useState({ orders: 0, revenue: 0, pending: 0, products: 0 });
  const [recent, setRecent] = useState<any[]>([]);
  const [byMethod, setByMethod] = useState<Record<string, number>>({});

  useEffect(() => {
    (async () => {
      const [{ data: orders }, { count: prodCount }] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("products").select("*", { count: "exact", head: true }),
      ]);
      const list = orders || [];
      // CA uniquement sur commandes livrées
      const revenue = list
        .filter((o: any) => o.status === "delivered")
        .reduce((s: number, o: any) => s + (o.total_xaf || 0), 0);
      const pending = list.filter((o: any) => o.status === "pending").length;
      const methods: Record<string, number> = {};
      list.forEach((o: any) => { methods[o.payment_method] = (methods[o.payment_method] || 0) + 1; });
      setStats({ orders: list.length, revenue, pending, products: prodCount || 0 });
      setRecent(list.slice(0, 8));
      setByMethod(methods);
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm">Aperçu de la plateforme SkyRide Store.</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card icon={ShoppingCart} label="Commandes" value={stats.orders} color="bg-primary/15 text-primary" />
        <Card
          icon={Wallet}
          label="Chiffre d'affaires"
          value={formatEUR(stats.revenue)}
          color="bg-success/15 text-success"
          note="Commandes livrées uniquement"
        />
        <Card icon={TrendingUp} label="En attente" value={stats.pending} color="bg-accent/30 text-accent-foreground" />
        <Card icon={Package} label="Produits" value={stats.products} color="bg-secondary/15 text-secondary" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-2xl p-5 shadow-soft border border-border/50">
          <h2 className="font-bold mb-4">Commandes récentes</h2>
          <div className="space-y-2">
            {recent.length === 0 && <p className="text-sm text-muted-foreground">Aucune commande pour le moment.</p>}
            {recent.map((o) => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/40">
                <div>
                  <p className="font-semibold text-sm">{o.reference}</p>
                  <p className="text-xs text-muted-foreground">{o.customer_name} · {o.city}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-primary">{formatEUR(o.total_xaf)}</p>
                  <p className={`text-[10px] uppercase font-semibold ${
                    o.status === "delivered" ? "text-success" :
                    o.status === "cancelled" ? "text-destructive" :
                    "text-muted-foreground"
                  }`}>{o.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-card rounded-2xl p-5 shadow-soft border border-border/50">
          <h2 className="font-bold mb-4">Modes de paiement</h2>
          <div className="space-y-3">
            {Object.entries(byMethod).map(([m, n]) => {
              const total = stats.orders || 1;
              const pct = Math.round((n / total) * 100);
              return (
                <div key={m}>
                  <div className="flex justify-between text-xs mb-1"><span className="font-semibold">{m === "gift_card" ? "Carte cadeau" : m === "crypto" ? "Crypto-monnaie" : m}</span><span className="text-muted-foreground">{n} ({pct}%)</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-gradient-cta" style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
            {Object.keys(byMethod).length === 0 && <p className="text-sm text-muted-foreground">Aucune donnée.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
