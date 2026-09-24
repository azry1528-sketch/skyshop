import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatEUR } from "@/lib/jangolo";
import { Eye, Users, TrendingUp, MapPin, Smartphone, Monitor, ShoppingBag, Calendar } from "lucide-react";

const Visitors = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: ordersData }, { data: visitData }] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("page_views").select("*").order("visited_at", { ascending: false }).limit(500).maybeSingle().then(() =>
          supabase.from("page_views").select("*").order("visited_at", { ascending: false }).limit(500)
        ).catch(() => ({ data: [] })),
      ]);
      setOrders(ordersData || []);
      setVisits((visitData as any) || []);
      setLoading(false);
    })();
  }, []);

  // Stats from orders
  const cityCount: Record<string, number> = {};
  const methodCount: Record<string, number> = {};
  orders.forEach(o => {
    if (o.city) cityCount[o.city] = (cityCount[o.city] || 0) + 1;
    if (o.payment_method) methodCount[o.payment_method] = (methodCount[o.payment_method] || 0) + 1;
  });
  const topCities = Object.entries(cityCount).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const revenueTotal = orders.filter(o => o.status === "delivered").reduce((s, o) => s + (o.total_xaf || 0), 0);

  // Last 7 days orders
  const last7: Record<string, number> = {};
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    last7[d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })] = 0;
  }
  orders.forEach(o => {
    const d = new Date(o.created_at);
    const diff = Math.floor((today.getTime() - d.getTime()) / 86400000);
    if (diff <= 6) {
      const key = d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" });
      if (last7[key] !== undefined) last7[key]++;
    }
  });
  const maxOrders = Math.max(...Object.values(last7), 1);

  const statCards = [
    { icon: ShoppingBag, label: "Commandes totales", value: orders.length, color: "text-primary" },
    { icon: Users, label: "Clients uniques", value: new Set(orders.map(o => o.phone).filter(Boolean)).size, color: "text-blue-500" },
    { icon: TrendingUp, label: "CA livré", value: formatEUR(revenueTotal), color: "text-success" },
    { icon: Eye, label: "Cette semaine", value: Object.values(last7).reduce((a, b) => a + b, 0) + " cmd", color: "text-accent-foreground" },
  ];

  if (loading) return <div className="p-8 text-center text-muted-foreground">Chargement…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Visiteurs & Activité</h1>
        <p className="text-muted-foreground text-sm">Statistiques basées sur les commandes</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(s => (
          <div key={s.label} className="bg-card rounded-2xl p-4 border border-border/50 shadow-soft">
            <s.icon className={`h-6 w-6 mb-2 ${s.color}`} />
            <p className="text-2xl font-extrabold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Activity last 7 days */}
      <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-soft">
        <h2 className="font-bold mb-4 flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Activité — 7 derniers jours</h2>
        <div className="flex items-end gap-2 h-28">
          {Object.entries(last7).map(([day, count]) => (
            <div key={day} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-primary">{count > 0 ? count : ""}</span>
              <div
                className="w-full rounded-t-lg bg-gradient-cta opacity-80 transition-all"
                style={{ height: `${Math.max(4, (count / maxOrders) * 96)}px` }}
              />
              <span className="text-[10px] text-muted-foreground">{day}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top cities + payment methods */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-soft">
          <h2 className="font-bold mb-3 flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> Top villes</h2>
          {topCities.length === 0 ? <p className="text-sm text-muted-foreground">Aucune donnée</p> : (
            <ul className="space-y-2">
              {topCities.map(([city, count]) => (
                <li key={city} className="flex items-center gap-2">
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-gradient-cta rounded-full" style={{ width: `${(count / topCities[0][1]) * 100}%` }} />
                  </div>
                  <span className="text-sm font-semibold w-24 truncate">{city || "—"}</span>
                  <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-soft">
          <h2 className="font-bold mb-3 flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary" /> Modes de paiement</h2>
          {Object.keys(methodCount).length === 0 ? <p className="text-sm text-muted-foreground">Aucune donnée</p> : (
            <ul className="space-y-2">
              {Object.entries(methodCount).sort((a, b) => b[1] - a[1]).map(([method, count]) => (
                <li key={method} className="flex items-center justify-between">
                  <span className="text-sm font-semibold uppercase">{method}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-muted rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / orders.length) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Recent orders table */}
      <div className="bg-card rounded-2xl p-5 border border-border/50 shadow-soft">
        <h2 className="font-bold mb-3 flex items-center gap-2"><Eye className="h-5 w-5 text-primary" /> 10 dernières commandes</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-xs uppercase">
                <th className="text-left py-2 pr-4">Référence</th>
                <th className="text-left py-2 pr-4">Client</th>
                <th className="text-left py-2 pr-4">Ville</th>
                <th className="text-left py-2 pr-4">Montant</th>
                <th className="text-left py-2">Statut</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 10).map(o => (
                <tr key={o.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-2 pr-4 font-mono text-xs text-primary">{o.reference}</td>
                  <td className="py-2 pr-4 truncate max-w-[120px]">{o.customer_name || "—"}</td>
                  <td className="py-2 pr-4">{o.city || "—"}</td>
                  <td className="py-2 pr-4 font-bold">{formatEUR(o.total_xaf)}</td>
                  <td className="py-2"><span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${o.status === "delivered" ? "bg-success/15 text-success" : o.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-muted text-muted-foreground"}`}>{o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Visitors;
