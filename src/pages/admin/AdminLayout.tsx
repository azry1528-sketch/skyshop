import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth, useIsAdmin } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Package, ShoppingCart, LogOut, Home, Users, Eye, TrendingUp, ShieldCheck, Layers } from "lucide-react";
import { BRAND } from "@/lib/jangolo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  super_admin: { label: "Super Admin", className: "bg-destructive/15 text-destructive border-destructive/30" },
  admin:       { label: "Admin",       className: "bg-primary/15 text-primary border-primary/30" },
  moderator:   { label: "Modérateur",  className: "bg-accent/15 text-accent-foreground border-accent/30" },
};

const AdminLayout = () => {
  const { user, loading } = useAuth();
  const { isAdmin, role, isSuperAdmin, checked } = useIsAdmin(user?.id);
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (checked && role === "moderator" && window.location.pathname === "/admin") {
      navigate("/admin/products", { replace: true });
    }
  }, [checked, role, navigate]);

  if (loading || !user || !checked) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Chargement…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center gap-4">
        <ShieldCheck className="h-12 w-12 text-muted-foreground" />
        <h1 className="text-2xl font-bold">Accès refusé</h1>
        <p className="text-muted-foreground max-w-md">Votre compte n'a pas les droits administrateur. Contactez le super admin pour obtenir l'accès.</p>
        <p className="text-xs text-muted-foreground">Votre identifiant : <code className="bg-muted px-2 py-1 rounded">{user.id}</code></p>
        <Button onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }}>Se déconnecter</Button>
      </div>
    );
  }

  // Modérateurs : accès limité (pas users, pas performances)
  const nav = [
    { to: "/admin",             icon: LayoutDashboard, label: "Tableau de bord", end: true,  roles: ["super_admin","admin"] },
    { to: "/admin/products",    icon: Package,         label: "Produits",                     roles: ["super_admin","admin","moderator"] },
    { to: "/admin/categories",  icon: Layers,          label: "Catégories",                   roles: ["super_admin","admin"] },
    { to: "/admin/orders",      icon: ShoppingCart,    label: "Commandes",                    roles: ["super_admin","admin","moderator"] },
    { to: "/admin/users",       icon: Users,           label: "Utilisateurs",                 roles: ["super_admin","admin"] },
    { to: "/admin/visitors",    icon: Eye,             label: "Visiteurs",                    roles: ["super_admin","admin"] },
    { to: "/admin/performance", icon: TrendingUp,      label: "Performances",                 roles: ["super_admin","admin"] },
  ].filter(n => n.roles.includes(role));

  const badge = ROLE_BADGE[role];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-muted/30">
      <aside className="md:w-64 md:min-h-screen bg-card border-b md:border-b-0 md:border-r border-border flex md:flex-col">
        <div className="p-5 border-b border-border hidden md:block">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-cta flex items-center justify-center text-primary-foreground font-extrabold">S</div>
            <div>
              <span className="font-bold block">{BRAND} admin</span>
              {badge && (
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-4 mt-0.5 ${badge.className}`}>
                  <ShieldCheck className="h-2.5 w-2.5 mr-1" />{badge.label}
                </Badge>
              )}
            </div>
          </div>
        </div>
        <nav className="flex md:flex-col gap-1 p-2 md:p-3 flex-1 overflow-x-auto">
          {nav.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end as any} className={({ isActive }) => `flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap ${isActive ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
              <n.icon className="h-4 w-4" /> {n.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden md:block p-3 border-t border-border space-y-1">
          <NavLink to="/" className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-muted"><Home className="h-4 w-4" /> Voir le site</NavLink>
          <button onClick={async () => { await supabase.auth.signOut(); navigate("/auth"); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm hover:bg-muted text-destructive"><LogOut className="h-4 w-4" /> Déconnexion</button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 max-w-full overflow-x-hidden"><Outlet /></main>
    </div>
  );
};

export default AdminLayout;
