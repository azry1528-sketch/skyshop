import { Link, useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import Header from "@/components/jangolo/Header";
import Footer from "@/components/jangolo/Footer";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Package, Truck, Home, Clock, Gift, AlertTriangle, Calendar, Download, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/contexts/I18nContext";
import { pixelPurchase } from "@/lib/fbPixel";

const formatEURNum = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " €";

// Génère et télécharge automatiquement le reçu PDF via iframe caché
const generatePDF = (order: any, reference: string) => {
  const items: any[] = order?.items || [];
  const isPreorder = order?.is_preorder;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<title>Reçu ${reference}</title>
<style>
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } @page { margin: 0; } }
  body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #fff; color: #1a1a1a; }
  .header { background: linear-gradient(135deg, #f97316, #ea580c); color: white; padding: 32px 40px; }
  .logo { font-size: 28px; font-weight: 900; letter-spacing: -1px; }
  .subtitle { font-size: 13px; opacity: 0.85; margin-top: 4px; }
  .badge { display: inline-block; background: rgba(255,255,255,0.2); border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: 700; margin-top: 12px; }
  .body { padding: 32px 40px; }
  .ref { font-size: 22px; font-weight: 900; color: #f97316; margin-bottom: 4px; }
  .status-badge { display: inline-block; background: ${isPreorder ? "#fef3c7" : "#dcfce7"}; color: ${isPreorder ? "#92400e" : "#166534"}; border-radius: 8px; padding: 4px 12px; font-size: 12px; font-weight: 700; margin-bottom: 24px; }
  .section { margin-bottom: 24px; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #6b7280; margin-bottom: 10px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
  .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
  .row:last-child { border: none; }
  .label { color: #6b7280; }
  .value { font-weight: 600; }
  .total-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 16px; font-weight: 900; color: #f97316; border-top: 2px solid #f97316; margin-top: 8px; }
  .items { background: #f9fafb; border-radius: 10px; padding: 14px 18px; margin-bottom: 8px; }
  .item { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; }
  .footer { background: #f9fafb; padding: 20px 40px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
  .tracking { background: linear-gradient(135deg, #eff6ff, #dbeafe); border: 1px solid #bfdbfe; border-radius: 10px; padding: 14px 18px; margin-top: 16px; }
  .tracking-num { font-size: 20px; font-weight: 900; color: #1d4ed8; letter-spacing: 2px; }
  .warn { background: #fffbeb; border: 1px solid #fde68a; border-radius: 10px; padding: 12px 16px; font-size: 12px; color: #92400e; margin-top: 16px; }
</style>
</head>
<body>
  <div class="header">
    <div class="logo">SkyRide Store</div>
    <div class="subtitle">Paris, France · skyridestore.fr</div>
    <div class="badge">${isPreorder ? "REÇU DE PRÉCOMMANDE" : "REÇU DE COMMANDE"}</div>
  </div>
  <div class="body">
    <div class="ref">#${reference}</div>
    <div class="status-badge">${isPreorder ? "Précommande enregistrée" : "Commande confirmée"}</div>
    <div class="tracking">
      <div style="font-size:11px;font-weight:700;color:#1d4ed8;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Numéro de suivi</div>
      <div class="tracking-num">${reference}</div>
      <div style="font-size:11px;color:#3b82f6;margin-top:4px;">Conservez ce code pour suivre votre commande</div>
    </div>
    <div class="section" style="margin-top:24px;">
      <div class="section-title">Informations client</div>
      <div class="row"><span class="label">Nom</span><span class="value">${order?.customer_name || "—"}</span></div>
      <div class="row"><span class="label">Téléphone</span><span class="value">${order?.phone || "—"}</span></div>
      <div class="row"><span class="label">Email</span><span class="value">${order?.email || "—"}</span></div>
      <div class="row"><span class="label">Ville</span><span class="value">${order?.city || "—"}</span></div>
      <div class="row"><span class="label">Adresse</span><span class="value">${order?.address || "—"}</span></div>
    </div>
    <div class="section">
      <div class="section-title">Articles commandés</div>
      <div class="items">
        ${items.map((i: any) => `<div class="item"><span>${i.qty}× ${i.name}</span><span style="font-weight:700;">${new Intl.NumberFormat("fr-FR").format(i.price_xaf * i.qty)} €</span></div>`).join("")}
      </div>
    </div>
    <div class="section">
      <div class="section-title">Récapitulatif financier</div>
      <div class="row"><span class="label">Sous-total</span><span class="value">${new Intl.NumberFormat("fr-FR").format(order?.subtotal_xaf || 0)} €</span></div>
      <div class="row"><span class="label">Livraison</span><span class="value">${new Intl.NumberFormat("fr-FR").format(order?.delivery_fee_xaf || 0)} €</span></div>
      <div class="row"><span class="label">Mode de paiement</span><span class="value">${(order?.payment_method || "—").toUpperCase()}</span></div>
      <div class="row"><span class="label">Statut</span><span class="value">${order?.status || "pending"}</span></div>
      ${isPreorder ? `
        <div class="row"><span class="label">Acompte payé (${order?.deposit_pct || 30}%)</span><span class="value" style="color:#f97316;">${new Intl.NumberFormat("fr-FR").format(order?.deposit_amount_xaf || order?.total_xaf || 0)} €</span></div>
        <div class="row"><span class="label">Reste à la livraison</span><span class="value">${new Intl.NumberFormat("fr-FR").format(order?.remaining_amount_xaf || 0)} €</span></div>
      ` : ""}
      <div class="total-row"><span>TOTAL PAYÉ</span><span>${new Intl.NumberFormat("fr-FR").format(order?.total_xaf || 0)} €</span></div>
    </div>
    ${isPreorder ? `<div class="warn">⚠ Précommande confirmée après paiement de l'acompte · Le solde est dû à la livraison</div>` : ""}
    <div style="margin-top:24px;font-size:11px;color:#6b7280;text-align:center;">
      Document généré le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
    </div>
  </div>
  <div class="footer">SkyRide Store · Paris, France<br/>Ce document fait foi de votre commande. Conservez-le précieusement.</div>
  <script>window.onload = function(){ window.print(); };<\/script>
</body>
</html>`;

  // Téléchargement automatique via blob URL
  const blob = new Blob([html], { type: "text/html" });
  const blobUrl = URL.createObjectURL(blob);

  // Iframe caché qui déclenche l'impression automatiquement
  const iframe = document.createElement("iframe");
  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;";
  iframe.src = blobUrl;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch {
      // Fallback : lien de téléchargement direct
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `recu-${reference}.html`;
      a.click();
    }
    setTimeout(() => {
      document.body.removeChild(iframe);
      URL.revokeObjectURL(blobUrl);
    }, 2000);
  };
};

const OrderConfirmation = () => {
  const { reference } = useParams();
  const [order, setOrder] = useState<any>(null);
  const pdfTriggered = useRef(false);
  const { t, formatPrice } = useI18n();

  const STATUS_STEPS = [
    { key: "pending", label: t("status.pending"), icon: Clock },
    { key: "confirmed", label: t("status.confirmed"), icon: CheckCircle2 },
    { key: "shipped", label: t("status.shipped"), icon: Truck },
    { key: "delivered", label: t("status.delivered"), icon: Home },
  ];

  useEffect(() => {
    if (!reference) return;
    supabase.from("orders").select("*").eq("reference", reference).maybeSingle()
      .then(({ data }) => {
        setOrder(data);
        // Auto-téléchargement du reçu PDF dès que les données arrivent
        if (data && !pdfTriggered.current) {
          pdfTriggered.current = true;
          setTimeout(() => generatePDF(data, reference!), 800);
        }
        // Pixel Facebook : Purchase, une seule fois par commande même si la page est rafraîchie
        if (data) {
          const trackedKey = `fb_purchase_tracked_${reference}`;
          if (!sessionStorage.getItem(trackedKey)) {
            sessionStorage.setItem(trackedKey, "1");
            const orderItems: any[] = data.items || [];
            pixelPurchase({
              contentIds: orderItems.map((i: any) => i.id).filter(Boolean),
              value: data.total_xaf || 0,
              orderReference: reference,
            });
          }
        }
      });
  }, [reference]);

  const status = order?.status || "pending";
  const currentStep = Math.max(0, STATUS_STEPS.findIndex(s => s.key === status));
  const items: any[] = order?.items || [];
  const itemNames = items.map((i: any) => `${i.qty}× ${i.name}`).join(", ");

  const trackUrl = typeof window !== "undefined" ? `${window.location.origin}/suivi?cmd=${reference}` : `/suivi?cmd=${reference}`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="container flex-1 py-10 max-w-2xl mx-auto">
        <div className="text-center">
          <div className={`h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4 ${order?.is_preorder ? "bg-primary/15 text-primary" : "bg-success/15 text-success"}`}>
            {order?.is_preorder ? <Gift className="h-10 w-10" /> : <Package className="h-10 w-10" />}
          </div>
          <h1 className="text-3xl font-extrabold mb-1">
            {order?.is_preorder ? "Précommande confirmée !" : t("confirm.title")}
          </h1>
          <p className="text-muted-foreground">
            {order?.is_preorder
              ? "Votre réservation a bien été enregistrée."
              : t("confirm.thanks")}
          </p>
          <p className="text-sm mt-1">{t("confirm.ref")} : <span className="font-bold text-primary">{reference}</span></p>

          {/* Articles commandés */}
          {items.length > 0 && (
            <div className="mt-4 bg-muted/50 rounded-xl px-4 py-3 text-sm inline-block text-left">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Article{items.length > 1 ? "s" : ""} commandé{items.length > 1 ? "s" : ""}</p>
              {items.map((i: any, idx: number) => (
                <p key={idx} className="font-semibold">{i.qty}× {i.name}</p>
              ))}
            </div>
          )}
        </div>

        {/* Barre de statut */}
        <div className="mt-8 bg-card rounded-2xl p-5 shadow-soft border border-border/50">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">{t("confirm.status")}</p>
          <div className="flex justify-between relative">
            <div className="absolute top-5 left-5 right-5 h-1 bg-muted rounded-full -z-0">
              <div className="h-full bg-gradient-cta rounded-full transition-all" style={{ width: `${(currentStep/(STATUS_STEPS.length-1))*100}%` }} />
            </div>
            {STATUS_STEPS.map((s, i) => {
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

        {order && (
          <>
            {/* ─── RÉCAP PRÉCOMMANDE ─── */}
            {order.is_preorder && (
              <div className="mt-5 bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-3">
                <p className="font-bold text-primary flex items-center gap-2"><Gift className="h-4 w-4" /> Détails de votre précommande</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Acompte payé</span>
                    <span className="font-bold text-success">{formatPrice(order.deposit_amount_xaf || order.total_xaf)}</span>
                  </div>
                  {order.remaining_amount_xaf > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reste à payer à la livraison</span>
                      <span className="font-bold text-primary">{formatPrice(order.remaining_amount_xaf)}</span>
                    </div>
                  )}
                </div>
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-700 rounded-xl p-3 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                  <p className="flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 shrink-0" /> Nous vous contacterons par email dès l'arrivée du stock.</p>
                  <p className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 shrink-0" /> Livraison estimée : 7 à 14 jours selon disponibilité.</p>
                  <p>En cas de retard important, remboursement de l'acompte possible sur demande.</p>
                </div>
              </div>
            )}

            {/* ─── RÉCAP COMMANDE ─── */}
            <div className="mt-5 bg-card rounded-2xl p-5 shadow-soft border border-border/50 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-muted-foreground">{order.is_preorder ? "Total acompte" : t("checkout.total")}</span><span className="font-bold text-primary">{formatPrice(order.total_xaf)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("checkout.payment")}</span><span className="font-semibold uppercase">{order.payment_method}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">{t("checkout.delivery")}</span><span className="font-semibold">{order.city}</span></div>
            </div>
          </>
        )}

        {/* ─── TÉLÉCHARGEMENT REÇU ─── */}
        <div className="mt-5 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-start gap-3">
            <Download className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold text-blue-800 dark:text-blue-200">Reçu téléchargé automatiquement</p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                Le code de tracking <strong>{reference}</strong> a été téléchargé dans votre reçu.
                Si vous voulez retrouver toutes vos commandes et codes de tracking, veuillez créer un compte.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => order && generatePDF(order, reference!)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" /> Re-télécharger le reçu
            </button>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-300 text-blue-700 dark:text-blue-300 text-sm font-semibold hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <UserPlus className="h-4 w-4" /> Créer un compte
            </Link>
          </div>
        </div>

        <div className="mt-5 bg-card rounded-2xl p-5 shadow-soft border border-border/50 text-sm space-y-3">
          <p className="font-semibold">{t("confirm.next")}</p>
          <ol className="list-decimal list-inside space-y-2 text-foreground/80">
            <li>{t("confirm.step1")}</li>
            <li>{t("confirm.step2")}</li>
            <li>{t("confirm.step3")}</li>
          </ol>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
          <Button asChild variant="outline"><Link to="/">{t("confirm.home")}</Link></Button>
          <Button asChild className="bg-gradient-cta"><Link to={`/suivi?cmd=${reference}`}><Package className="h-4 w-4 mr-2" />{t("nav.track")}</Link></Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderConfirmation;
