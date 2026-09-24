import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatEUR } from "@/lib/jangolo";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { MapPin, Gift, MessageCircle, Filter, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-accent/20 text-accent-foreground border-accent/30",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  shipped: "bg-secondary/20 text-secondary border-secondary/30",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "preorder" | "normal">("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const load = async () => {
    const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
    setOrders(data || []);
  };
  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Statut mis à jour");
    load();
  };

  // Bulk confirm all preorders
  const convertPreorders = async () => {
    const ids = orders.filter(o => o.is_preorder && o.status === "pending").map(o => o.id);
    if (!ids.length) { toast.info("Aucune précommande en attente."); return; }
    for (const id of ids) await supabase.from("orders").update({ status: "confirmed" }).eq("id", id);
    toast.success(`${ids.length} précommande(s) converties en "confirmé"`);
    load();
  };

  const filtered = orders.filter(o => {
    if (filter === "preorder" && !o.is_preorder) return false;
    if (filter === "normal" && o.is_preorder) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    return true;
  });

  const preorderPending = orders.filter(o => o.is_preorder && o.status === "pending");
  const preorderRevenue = orders.filter(o => o.is_preorder && o.status === "delivered")
    .reduce((s, o) => s + (o.total_xaf || 0), 0);
  const totalDeposits = orders.filter(o => o.is_preorder && o.status !== "cancelled")
    .reduce((s, o) => s + (o.deposit_amount_xaf || o.total_xaf || 0), 0);
  const totalRemaining = orders.filter(o => o.is_preorder && !["delivered", "cancelled"].includes(o.status))
    .reduce((s, o) => s + (o.remaining_amount_xaf || 0), 0);

  const hasPreorders = orders.some(o => o.is_preorder);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Commandes</h1>
          <p className="text-muted-foreground text-sm">{orders.length} commande{orders.length > 1 ? "s" : ""}</p>
        </div>
        {hasPreorders && preorderPending.length > 0 && (
          <button
            onClick={convertPreorders}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            ✅ Confirmer {preorderPending.length} précommande{preorderPending.length > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* ─── KPI Précommandes ─── */}
      {hasPreorders && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Précommandes actives", value: preorderPending.length, icon: Gift, color: "bg-primary/10 text-primary" },
            { label: "Acomptes encaissés", value: formatEUR(totalDeposits), icon: Wallet, color: "bg-success/10 text-success" },
            { label: "Reste à percevoir", value: formatEUR(totalRemaining), icon: Wallet, color: "bg-accent/20 text-accent-foreground" },
            { label: "CA préco livré", value: formatEUR(preorderRevenue), icon: Gift, color: "bg-secondary/15 text-secondary" },
          ].map(c => (
            <div key={c.label} className="bg-card rounded-2xl p-4 border border-border/50 shadow-soft">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{c.label}</span>
                <span className={`h-7 w-7 rounded-lg flex items-center justify-center ${c.color}`}><c.icon className="h-3.5 w-3.5" /></span>
              </div>
              <p className="text-lg font-extrabold">{c.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ─── Filtres ─── */}
      <div className="flex flex-wrap gap-2 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        {(["all", "normal", "preorder"] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${filter === f ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50"}`}
          >
            {f === "all" ? "Toutes" : f === "preorder" ? "🚀 Précommandes" : "🛒 Normales"}
          </button>
        ))}
        <div className="ml-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ─── Tableau ─── */}
      <div className="bg-card rounded-2xl shadow-soft border border-border/50 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
          <div className="col-span-2">Réf</div>
          <div className="col-span-3">Client</div>
          <div className="col-span-2">Ville</div>
          <div className="col-span-2">Total</div>
          <div className="col-span-1">Mode</div>
          <div className="col-span-2">Statut</div>
        </div>

        {filtered.map((o) => (
          <div key={o.id} className="border-b border-border last:border-0">
            <div className="grid grid-cols-2 md:grid-cols-12 gap-2 md:gap-3 px-4 py-3 text-sm items-center">
              <div className="md:col-span-2">
                <p
                  className="font-bold text-primary cursor-pointer hover:underline"
                  onClick={() => setOpenId(openId === o.id ? null : o.id)}
                >
                  {o.reference}
                </p>
                {o.is_preorder && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full mt-0.5">
                    <Gift className="h-2.5 w-2.5" /> PRÉ-COMMANDE
                  </span>
                )}
              </div>
              <div className="md:col-span-3">
                <p className="font-semibold">{o.customer_name}</p>
                <p className="text-xs text-muted-foreground">{o.phone}</p>
              </div>
              <div className="md:col-span-2 text-muted-foreground">{o.city}</div>
              <div className="md:col-span-2">
                <p className="font-bold">{formatEUR(o.total_xaf)}</p>
                {o.is_preorder && o.remaining_amount_xaf > 0 && (
                  <p className="text-[10px] text-accent-foreground font-semibold">+{formatEUR(o.remaining_amount_xaf)} livraison</p>
                )}
              </div>
              <div className="md:col-span-1 text-xs uppercase">{o.payment_method === "gift_card" ? "Carte cadeau" : o.payment_method === "crypto" ? "Crypto" : o.payment_method}</div>
              <div className="md:col-span-2 flex items-center gap-1">
                <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                  <SelectTrigger className={`h-9 text-xs border flex-1 ${STATUS_COLORS[o.status] || ""}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
                <button
                  onClick={async () => {
                    if (!confirm(`Supprimer la commande ${o.reference} ?`)) return;
                    const { error } = await supabase.from("orders").delete().eq("id", o.id);
                    if (error) { toast.error(error.message); return; }
                    toast.success("Commande supprimée"); load();
                  }}
                  className="h-9 w-9 flex items-center justify-center rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                  title="Supprimer la commande"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* ─── Détails dépliés ─── */}
            {openId === o.id && (
              <div className="px-4 pb-4 pt-1 bg-muted/30 text-sm space-y-3">

                {/* Infos précommande */}
                {o.is_preorder && (
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-1.5">
                    <p className="font-bold text-primary text-xs uppercase tracking-wide flex items-center gap-1.5"><Gift className="h-3.5 w-3.5" /> Précommande</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <p><span className="text-muted-foreground">Acompte encaissé :</span> <strong className="text-success">{formatEUR(o.deposit_amount_xaf || o.total_xaf)}</strong></p>
                      <p><span className="text-muted-foreground">Reste à percevoir :</span> <strong className="text-primary">{formatEUR(o.remaining_amount_xaf || 0)}</strong></p>
                    </div>
                    {/* Notification email */}
                    <a
                      href={`mailto:${o.email || ""}?subject=${encodeURIComponent(`Votre précommande ${o.reference} est prête !`)}&body=${encodeURIComponent(
                        `Bonjour ${o.customer_name},\nVotre précommande ${o.reference} est prête !\nLivraison prévue très prochainement. Reste à régler : ${formatEUR(o.remaining_amount_xaf || 0)}.\nNous vous contactons pour fixer la date de livraison.`
                      )}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-success text-success-foreground text-xs font-semibold hover:opacity-90 mt-1"
                    >
                      <MessageCircle className="h-3.5 w-3.5" /> Notifier le client (email)
                    </a>
                  </div>
                )}

                {/* Infos client */}
                <div className="grid md:grid-cols-2 gap-2 text-xs">
                  <p><span className="text-muted-foreground">Adresse :</span> {o.address}, {o.city} ({o.delivery_zone})</p>
                  <p><span className="text-muted-foreground">Email :</span> {o.email || "—"}</p>
                  <p><span className="text-muted-foreground">Date :</span> {new Date(o.created_at).toLocaleString("fr-FR")}</p>
                </div>

                {/* GPS */}
                {o.latitude && o.longitude ? (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary shrink-0" />
                    <a
                      href={`https://maps.google.com/?q=${o.latitude},${o.longitude}`}
                      target="_blank" rel="noreferrer"
                      className="text-blue-600 underline text-xs font-semibold"
                    >
                      Voir la localisation sur Google Maps
                    </a>
                    {o.geo_address && <span className="text-xs text-muted-foreground">· {o.geo_address}</span>}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Localisation GPS non fournie
                  </p>
                )}

                {/* Articles */}
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Articles commandés</p>
                  <ul className="space-y-1">
                    {(o.items as any[])?.map((it: any, i: number) => (
                      <li key={i} className="flex justify-between text-xs bg-background rounded-lg px-3 py-1.5">
                        <span>{it.qty}× {it.name}</span>
                        <span className="font-semibold">{formatEUR(it.price_xaf)}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground mt-2">
                    Sous-total {formatEUR(o.subtotal_xaf)} · Livraison {formatEUR(o.delivery_fee_xaf)}
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <p className="p-8 text-center text-muted-foreground text-sm">Aucune commande.</p>
        )}
      </div>
    </div>
  );
};

export default Orders;
