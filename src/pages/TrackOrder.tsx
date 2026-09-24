import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Header from "@/components/jangolo/Header";
import Footer from "@/components/jangolo/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/contexts/I18nContext";
import { Package, Search, CheckCircle2, Clock, Truck, Home, MessageCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const TrackOrder = () => {
  const { t, formatPrice } = useI18n();
  const [params] = useSearchParams();
  const [reference, setReference] = useState(params.get("cmd") || "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const STEPS = [
    { key: "pending", label: t("status.pending"), icon: Clock },
    { key: "confirmed", label: t("status.confirmed"), icon: CheckCircle2 },
    { key: "shipped", label: t("status.shipped"), icon: Truck },
    { key: "delivered", label: t("status.delivered"), icon: Home },
  ];

  const lookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!reference.trim() || !phone.trim()) {
      toast.error(t("track.missing"));
      return;
    }
    setLoading(true);
    setError(null);
    setOrder(null);
    const { data, error } = await supabase.rpc("track_order", {
      _reference: reference.trim().toUpperCase(),
      _phone: phone.trim(),
    });
    setLoading(false);
    if (error) { setError(error.message); return; }
    if (!data || (Array.isArray(data) && data.length === 0)) {
      setError(t("track.not_found"));
      return;
    }
    setOrder(Array.isArray(data) ? data[0] : data);
  };

  useEffect(() => {
    if (params.get("cmd") && phone) lookup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const status = order?.status || "pending";
  const currentStep = Math.max(0, STEPS.findIndex(s => s.key === status));
  const eta = order ? new Date(new Date(order.created_at).getTime() + (order.delivery_zone === "autre" ? 5 : 1) * 86400000) : null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container flex-1 py-8 max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <div className="h-16 w-16 rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto mb-3">
            <Package className="h-8 w-8" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">{t("track.title")}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t("track.subtitle")}</p>
        </div>

        <form onSubmit={lookup} className="bg-card rounded-2xl p-5 shadow-soft border border-border/50 space-y-3">
          <div>
            <Label>{t("track.ref")}</Label>
            <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="JNG-XXXXXXXX" className="mt-1 uppercase" />
          </div>
          <div>
            <Label>{t("track.phone")}</Label>
            <Input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+237 6XX XX XX XX" className="mt-1" />
          </div>
          <Button type="submit" disabled={loading} className="w-full h-11 bg-gradient-cta font-semibold">
            <Search className="h-4 w-4 mr-2" /> {loading ? t("track.searching") : t("track.cta")}
          </Button>
        </form>

        {error && (
          <div className="mt-4 bg-destructive/10 border border-destructive/30 rounded-xl p-4 text-sm flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {order && (
          <div className="mt-6 space-y-4">
            <div className="bg-card rounded-2xl p-5 shadow-soft border border-border/50">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">{t("confirm.status")}</p>
              <div className="flex justify-between relative">
                <div className="absolute top-5 left-5 right-5 h-1 bg-muted rounded-full -z-0">
                  <div className="h-full bg-gradient-cta rounded-full transition-all" style={{ width: `${(currentStep/(STEPS.length-1))*100}%` }} />
                </div>
                {STEPS.map((s, i) => {
                  const Icon = s.icon;
                  const active = i <= currentStep;
                  return (
                    <div key={s.key} className="flex flex-col items-center gap-2 relative z-10 flex-1">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border"}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={`text-[11px] font-semibold text-center ${active ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-card rounded-2xl p-5 shadow-soft border border-border/50 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">{t("confirm.ref")}</span><span className="font-bold text-primary">{order.reference}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("checkout.total")}</span><span className="font-bold">{formatPrice(order.total_xaf)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("checkout.delivery")}</span><span className="font-semibold">{order.city}</span></div>
              {eta && <div className="flex justify-between"><span className="text-muted-foreground">{t("track.eta")}</span><span className="font-semibold">{eta.toLocaleDateString()}</span></div>}
            </div>

            <a
              href={`mailto:bonjour@skyridestore.fr?subject=${encodeURIComponent(`Suivi de ma commande ${order.reference}`)}`}
              className="flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-success text-success-foreground font-semibold hover:opacity-90 transition-smooth"
            >
              <MessageCircle className="h-5 w-5" /> {t("confirm.contact_wa")}
            </a>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default TrackOrder;
