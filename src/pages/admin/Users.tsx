import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { User, ShieldCheck, ShoppingBag, Search, Mail, Phone, Crown, Eye } from "lucide-react";
import { formatEUR } from "@/lib/jangolo";
import { useAuth, useIsAdmin, ADMIN_ROLES } from "@/hooks/useAuth";

const ROLE_STYLE: Record<string, string> = {
  super_admin: "bg-destructive/15 text-destructive border-destructive/30",
  admin:       "bg-primary/15 text-primary border-primary/30",
  moderator:   "bg-accent/15 text-accent-foreground border-accent/30",
  customer:    "bg-muted text-muted-foreground",
};

const ROLE_ICON: Record<string, React.ReactNode> = {
  super_admin: <Crown className="h-3 w-3 mr-1 inline" />,
  admin:       <ShieldCheck className="h-3 w-3 mr-1 inline" />,
  moderator:   <Eye className="h-3 w-3 mr-1 inline" />,
};

const Users = () => {
  const { user: currentUser } = useAuth();
  const { role: currentRole, isSuperAdmin } = useIsAdmin(currentUser?.id);
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "admins" | "customers">("all");

  const load = async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: roles } = await supabase.from("user_roles").select("*");
    const { data: orders } = await supabase.from("orders").select("user_id, total_xaf, status, reference, customer_name, phone, email, city, created_at");

    const roleMap: Record<string, string> = {};
    (roles || []).forEach((r: any) => { roleMap[r.user_id] = r.role; });

    const ordersByUser: Record<string, any[]> = {};
    (orders || []).forEach((o: any) => {
      if (o.user_id) {
        if (!ordersByUser[o.user_id]) ordersByUser[o.user_id] = [];
        ordersByUser[o.user_id].push(o);
      }
    });

    const enriched = (profiles || []).map((p: any) => ({
      ...p,
      role: roleMap[p.user_id] || "customer",
      orders: ordersByUser[p.user_id] || [],
      total_spent: (ordersByUser[p.user_id] || [])
        .filter((o: any) => o.status === "delivered")
        .reduce((s: number, o: any) => s + (o.total_xaf || 0), 0),
    }));

    setUsers(enriched);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const setRole = async (userId: string, role: string) => {
    // Seul super_admin peut nommer un autre super_admin ou admin
    if ((role === "super_admin" || role === "admin") && !isSuperAdmin) {
      return toast.error("Seul un Super Admin peut attribuer ce rôle.");
    }
    // Empêcher de se rétrograder soi-même
    if (userId === currentUser?.id && role === "customer") {
      return toast.error("Vous ne pouvez pas vous retirer vos propres droits admin.");
    }
    if (role === "customer") {
      await supabase.from("user_roles").delete().eq("user_id", userId);
    } else {
      const { error } = await supabase.from("user_roles").upsert({ user_id: userId, role: role as any }, { onConflict: "user_id" });
      if (error) return toast.error(error.message);
    }
    toast.success("Rôle mis à jour");
    load();
  };

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.user_id?.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ? true :
      filter === "admins" ? ["super_admin", "admin", "moderator"].includes(u.role) :
      u.role === "customer";
    return matchSearch && matchFilter;
  });

  const adminCount = users.filter(u => ["super_admin","admin","moderator"].includes(u.role)).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Utilisateurs</h1>
        <p className="text-muted-foreground text-sm">
          {users.length} compte{users.length > 1 ? "s" : ""} · {adminCount} admin{adminCount > 1 ? "s" : ""}
        </p>
      </div>

      {/* Résumé des admins */}
      {adminCount > 0 && (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-2">
          <p className="text-sm font-bold flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> Équipe admin</p>
          <div className="flex flex-wrap gap-2">
            {users.filter(u => ["super_admin","admin","moderator"].includes(u.role)).map(u => (
              <div key={u.user_id} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium ${ROLE_STYLE[u.role]}`}>
                {ROLE_ICON[u.role]}
                {u.display_name || "Sans nom"}
                <span className="opacity-60">· {ADMIN_ROLES.find(r => r.value === u.role)?.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filtres + Recherche */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            placeholder="Rechercher par nom ou ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1">
          {(["all","admins","customers"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-smooth ${filter === f ? "bg-primary text-primary-foreground" : "bg-card border border-border hover:bg-muted"}`}>
              {f === "all" ? "Tous" : f === "admins" ? "Admins" : "Clients"}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Chargement…</p>}

      <div className="bg-card rounded-2xl shadow-soft border border-border/50 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border">
          <div className="col-span-3">Nom / ID</div>
          <div className="col-span-3">Rôle</div>
          <div className="col-span-2">Commandes</div>
          <div className="col-span-2">Total dépensé</div>
          <div className="col-span-1">Inscrit</div>
          <div className="col-span-1"></div>
        </div>

        {filtered.map(u => (
          <div key={u.id} className="border-b border-border last:border-0">
            <div className="grid grid-cols-2 md:grid-cols-12 gap-2 md:gap-3 px-4 py-3 text-sm items-center">
              <div className="md:col-span-3">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${["super_admin","admin","moderator"].includes(u.role) ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {u.display_name?.[0]?.toUpperCase() || <User className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="font-semibold">{u.display_name || "Sans nom"}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{u.user_id.slice(0, 8)}…</p>
                  </div>
                </div>
              </div>
              <div className="md:col-span-3">
                <Select
                  value={u.role}
                  onValueChange={v => setRole(u.user_id, v)}
                  disabled={
                    // Modérateur ne peut pas changer les rôles
                    currentRole === "moderator" ||
                    // Admin ne peut pas modifier un super_admin
                    (currentRole === "admin" && u.role === "super_admin") ||
                    // Ne peut pas se modifier soi-même (sauf super_admin)
                    (u.user_id === currentUser?.id && !isSuperAdmin)
                  }
                >
                  <SelectTrigger className={`h-8 text-xs border ${ROLE_STYLE[u.role] || ""}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ADMIN_ROLES.map(r => (
                      // Admin ne peut pas attribuer super_admin
                      (r.value === "super_admin" && !isSuperAdmin) ? null : (
                        <SelectItem key={r.value} value={r.value}>
                          <span className="font-medium">{r.label}</span>
                          <span className="text-muted-foreground ml-2 text-[10px]">{r.description}</span>
                        </SelectItem>
                      )
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <span className="font-semibold">{u.orders.length}</span>
                <span className="text-muted-foreground text-xs ml-1">commande{u.orders.length > 1 ? "s" : ""}</span>
              </div>
              <div className="md:col-span-2 font-bold text-success text-sm">{formatEUR(u.total_spent)}</div>
              <div className="md:col-span-1 text-xs text-muted-foreground">
                {new Date(u.created_at).toLocaleDateString("fr-FR")}
              </div>
              <div className="md:col-span-1">
                <button className="text-xs text-primary underline" onClick={() => setOpenId(openId === u.id ? null : u.id)}>
                  {openId === u.id ? "Fermer" : "Détails"}
                </button>
              </div>
            </div>

            {openId === u.id && (
              <div className="px-4 pb-4 pt-1 bg-muted/30 space-y-3">
                <p className="text-xs font-bold uppercase text-muted-foreground">Informations du compte</p>
                <div className="grid sm:grid-cols-2 gap-2 text-sm">
                  <p><span className="text-muted-foreground">ID Supabase :</span> <code className="bg-muted px-1 rounded text-xs">{u.user_id}</code></p>
                  <p><span className="text-muted-foreground">Rôle :</span>{" "}
                    <Badge variant="outline" className={`text-xs ${ROLE_STYLE[u.role]}`}>
                      {ROLE_ICON[u.role]}{ADMIN_ROLES.find(r => r.value === u.role)?.label || u.role}
                    </Badge>
                  </p>
                  <p><span className="text-muted-foreground">Inscrit le :</span> {new Date(u.created_at).toLocaleString("fr-FR")}</p>
                </div>
                {u.orders.length > 0 && (
                  <>
                    <p className="text-xs font-bold uppercase text-muted-foreground pt-2">Historique commandes</p>
                    <div className="space-y-2">
                      {u.orders.map((o: any) => (
                        <div key={o.reference} className="flex items-center justify-between bg-card rounded-xl px-3 py-2 border border-border text-xs">
                          <div>
                            <p className="font-semibold text-primary">{o.reference}</p>
                            <p className="text-muted-foreground">{o.customer_name} · {o.city}</p>
                            {o.phone && <p className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {o.phone}</p>}
                            {o.email && <p className="text-muted-foreground flex items-center gap-1"><Mail className="h-3 w-3" /> {o.email}</p>}
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{formatEUR(o.total_xaf)}</p>
                            <Badge variant={o.status === "delivered" ? "default" : o.status === "cancelled" ? "destructive" : "secondary"} className="text-[10px]">{o.status}</Badge>
                            <p className="text-muted-foreground mt-0.5">{new Date(o.created_at).toLocaleDateString("fr-FR")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                {u.orders.length === 0 && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2"><ShoppingBag className="h-4 w-4" /> Aucune commande passée</p>
                )}
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && !loading && (
          <p className="p-8 text-center text-muted-foreground text-sm">Aucun utilisateur trouvé.</p>
        )}
      </div>
    </div>
  );
};

export default Users;
