import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/contexts/I18nContext";
import Header from "@/components/jangolo/Header";
import Footer from "@/components/jangolo/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Package, LogOut, User as UserIcon, Lock, Trash2, ChevronRight, MapPin, ArrowUpDown, CheckCircle2, Clock, Truck, Home } from "lucide-react";
import { toast } from "sonner";
import { DELIVERY_ZONES, FRANCE_CITIES } from "@/lib/jangolo";
import LocationPicker from "@/components/jangolo/LocationPicker";

type SortKey = "date_desc" | "date_asc" | "amount_desc" | "amount_asc";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  shipped: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  delivered: "bg-success/15 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};
const STATUS_ICONS: Record<string, any> = {
  pending: Clock, confirmed: CheckCircle2, shipped: Truck, delivered: Home,
};

const Account = () => {
  const { user, loading } = useAuth();
  const { t, formatPrice } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNewAccount = searchParams.get("complete") === "1";
  const [orders, setOrders] = useState<any[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("date_desc");
  const [newPassword, setNewPassword] = useState("");
  const [savingPwd, setSavingPwd] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [profile, setProfile] = useState({
    full_name: "", phone: "", city: "Paris",
    neighborhood: "", address: "", delivery_zone: "standard",
  });

  useEffect(() => {
    if (!loading && !user) navigate("/auth");
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase.from("orders").select("reference,status,total_xaf,created_at,items").eq("user_id", user.id)
      .then(({ data }) => setOrders(data || []));
    supabase.from("profiles").select("full_name,phone,city,neighborhood,address,delivery_zone,lat,lng")
      .eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setProfile({
            full_name: data.full_name || "",
            phone: data.phone || "",
            city: data.city || "Paris",
            neighborhood: data.neighborhood || "",
            address: data.address || "",
            delivery_zone: data.delivery_zone || "standard",
          });
          if (data.lat && data.lng) setPosition({ lat: data.lat, lng: data.lng });
        }
      });
  }, [user]);

  const sortedOrders = [...orders].sort((a, b) => {
    if (sortKey === "date_desc") return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortKey === "date_asc") return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortKey === "amount_desc") return b.total_xaf - a.total_xaf;
    return a.total_xaf - b.total_xaf;
  });

  const signOut = async () => { await supabase.auth.signOut(); navigate("/"); };

  const updatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) { toast.error("Mot de passe trop court (min. 6 caractères)"); return; }
    setSavingPwd(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSavingPwd(false);
    if (error) return toast.error(error.message);
    setNewPassword(""); toast.success("Mot de passe mis à jour");
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").upsert({
      user_id: user.id,
      full_name: profile.full_name,
      phone: profile.phone,
      city: profile.city,
      neighborhood: profile.neighborhood,
      address: profile.address,
      delivery_zone: profile.delivery_zone,
      ...(position ? { lat: position.lat, lng: position.lng } : {}),
    }, { onConflict: "user_id" });
    setSavingProfile(false);
    if (error) return toast.error(error.message);
    toast.success("Profil enregistré ✓");
  };

  const deleteAccount = async () => {
    setDeleting(true);
    const { error } = await supabase.functions.invoke("delete-account");
    setDeleting(false);
    if (error) return toast.error(error.message || "Erreur lors de la suppression");
    await supabase.auth.signOut();
    toast.success("Compte supprimé"); navigate("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="container py-8 flex-1 pb-24 md:pb-8 max-w-3xl">

        {/* Bannière bienvenue — nouveau compte */}
        {isNewAccount && (
          <div className="mb-5 bg-gradient-cta rounded-2xl p-5 text-white">
            <p className="font-extrabold text-lg mb-1">🎉 Bienvenue sur SkyRide Store !</p>
            <p className="text-sm opacity-90">Complétez vos informations de livraison ci-dessous pour commander encore plus vite la prochaine fois.</p>
          </div>
        )}

        {/* Header compte */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-gradient-cta flex items-center justify-center text-white font-extrabold text-xl">
              {(profile.full_name || user.email || "S")[0].toUpperCase()}
            </div>
            <div>
              <h1 className="text-xl font-bold">{profile.full_name || "Mon compte"}</h1>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            <LogOut className="h-4 w-4 mr-1" /> {t("nav.signout")}
          </Button>
        </div>

        {/* ── Mes commandes ── */}
        <section className="bg-card rounded-2xl border border-border/50 shadow-soft mb-5 overflow-hidden">
          <div className="flex items-center justify-between p-5 border-b border-border/50">
            <h2 className="font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> {t("account.orders")}
              {orders.length > 0 && <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">{orders.length}</span>}
            </h2>
            {orders.length > 1 && (
              <select
                value={sortKey}
                onChange={e => setSortKey(e.target.value as SortKey)}
                className="text-xs border border-border rounded-lg px-2 py-1 bg-background"
              >
                <option value="date_desc">Date ↓ (récent)</option>
                <option value="date_asc">Date ↑ (ancien)</option>
                <option value="amount_desc">Montant ↓</option>
                <option value="amount_asc">Montant ↑</option>
              </select>
            )}
          </div>
          <div className="max-h-72 overflow-y-auto">
            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground p-5">{t("account.no_orders")}</p>
            ) : (
              <ul className="divide-y divide-border">
                {sortedOrders.map(o => {
                  const StatusIcon = STATUS_ICONS[o.status] || Clock;
                  const itemNames = (o.items || []).map((i: any) => i.name).join(", ");
                  return (
                    <li key={o.reference}>
                      <Link to={`/order/${o.reference}`} className="p-4 flex items-center gap-3 hover:bg-muted/40 transition-smooth">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${STATUS_COLORS[o.status] || "bg-muted"}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">{o.reference}</p>
                          {itemNames && <p className="text-xs text-muted-foreground truncate">{itemNames}</p>}
                          <p className="text-xs text-muted-foreground">
                            {new Date(o.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                            {" · "}<span className={`font-semibold ${STATUS_COLORS[o.status]?.split(" ")[1] || ""}`}>{o.status}</span>
                          </p>
                        </div>
                        <span className="font-bold text-primary text-sm shrink-0">{formatPrice(o.total_xaf)}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        {/* ── Informations de livraison ── */}
        <section className="bg-card rounded-2xl p-5 border border-border/50 shadow-soft mb-5">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> Informations de livraison
          </h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Nom complet</Label>
                <Input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} placeholder="Aïcha Ndongo" className="mt-1" />
              </div>
              <div>
                <Label>Téléphone</Label>
                <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+237 6XX XX XX XX" className="mt-1" />
              </div>

              {/* Ville — liste déroulante */}
              <div>
                <Label>Ville</Label>
                <select
                  value={profile.city}
                  onChange={e => setProfile(p => ({ ...p, city: e.target.value, neighborhood: "" }))}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {FRANCE_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Code postal */}
              <div>
                <Label>Code postal</Label>
                <Input value={profile.neighborhood} onChange={e => setProfile(p => ({ ...p, neighborhood: e.target.value }))} placeholder="75011" className="mt-1" />
              </div>

              {/* Zone de livraison */}
              <div>
                <Label>Zone de livraison</Label>
                <select
                  value={profile.delivery_zone}
                  onChange={e => setProfile(p => ({ ...p, delivery_zone: e.target.value }))}
                  className="mt-1 w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {DELIVERY_ZONES.map(z => <option key={z.value} value={z.value}>{z.label}</option>)}
                </select>
              </div>

              {/* Adresse */}
              <div className="sm:col-span-2">
                <Label>Adresse précise</Label>
                <Input value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} placeholder="Ex: En face de la pharmacie, porte bleue" className="mt-1" />
              </div>
            </div>

            {/* Map de position */}
            <div>
              <Label className="flex items-center gap-1.5 mb-2">
                <MapPin className="h-4 w-4 text-primary" /> Position GPS précise
                <span className="text-xs text-muted-foreground ml-1">(pour une livraison exacte)</span>
              </Label>
              <LocationPicker value={position} onChange={(p) => setPosition(p)} />
            </div>

            <Button type="submit" disabled={savingProfile} className="bg-gradient-cta">
              {savingProfile ? "Enregistrement…" : "Enregistrer mes informations"}
            </Button>
          </form>
        </section>

        {/* ── Sécurité ── */}
        <section className="bg-card rounded-2xl p-5 border border-border/50 shadow-soft mb-5">
          <h2 className="font-bold mb-4 flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" /> {t("account.change_password")}
          </h2>
          <form onSubmit={updatePassword} className="flex flex-col sm:flex-row gap-2">
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
              placeholder={t("account.new_password")} minLength={6} required className="flex-1" />
            <Button type="submit" disabled={savingPwd} className="bg-gradient-cta">
              {savingPwd ? "…" : t("account.update")}
            </Button>
          </form>
        </section>

        {/* ── Zone danger ── */}
        <section className="bg-destructive/5 rounded-2xl p-5 border border-destructive/30">
          <h2 className="font-bold mb-2 flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" /> {t("account.danger")}
          </h2>
          <p className="text-sm text-muted-foreground mb-4">{t("account.delete_confirm")}</p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">{t("account.delete")}</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("account.delete")}</AlertDialogTitle>
                <AlertDialogDescription>{t("account.delete_confirm")}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction onClick={deleteAccount} disabled={deleting} className="bg-destructive hover:bg-destructive/90">
                  {deleting ? "…" : t("account.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Account;
