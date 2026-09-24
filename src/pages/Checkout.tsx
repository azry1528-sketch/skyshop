import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import Header from "@/components/jangolo/Header";
import Footer from "@/components/jangolo/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { DELIVERY_ZONES, PICKUP_ADDRESS, PAYMENT_METHODS, CRYPTO_WALLETS, GIFT_CARD_BRANDS, validateGiftCardCode, PAYPAL_ACCOUNT } from "@/lib/jangolo";
import { resolveImg } from "@/lib/images";
import { Minus, Plus, X, ShieldCheck, MessageCircle, Wallet, Truck, MapPin, AlertTriangle, Gift, Copy, Bitcoin, CheckCircle2, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useI18n } from "@/contexts/I18nContext";
import { useAuth } from "@/hooks/useAuth";
import LocationPicker from "@/components/jangolo/MapWrapper";
import { pixelInitiateCheckout } from "@/lib/fbPixel";

const Checkout = () => {
  const { items, total, setQty, remove, clear } = useCart();
  const { t, formatPrice: formatEUR } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [submitting, setSubmitting] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [geoAddress, setGeoAddress] = useState<string>("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    email: "",
    city: "",
    address: "",
    delivery_zone: "standard",
    payment_method: "gift_card",
    gift_card_brand: "",
    payment_reference: "",
  });

  // Pre-fill form from user profile if logged in
  useEffect(() => {
    if (!user || profileLoaded) return;
    supabase.from("profiles")
      .select("full_name,phone,city,address,delivery_zone")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm(f => ({
            ...f,
            customer_name: data.full_name || f.customer_name,
            phone: data.phone || f.phone,
            city: data.city || f.city,
            address: data.address || f.address,
            delivery_zone: data.delivery_zone || f.delivery_zone,
            email: user.email || f.email,
          }));
        } else if (user.email) {
          setForm(f => ({ ...f, email: user.email! }));
        }
        setProfileLoaded(true);
      });
  }, [user, profileLoaded]);

  // Pixel Facebook : InitiateCheckout dès l'arrivée sur la page (panier non vide)
  const checkoutTracked = useRef(false);
  useEffect(() => {
    if (checkoutTracked.current || items.length === 0) return;
    checkoutTracked.current = true;
    pixelInitiateCheckout({
      contentIds: items.map((i) => i.id),
      numItems: items.reduce((s, i) => s + i.quantity, 0),
      value: total,
    });
  }, [items, total]);

  const zone = DELIVERY_ZONES.find(z => z.value === form.delivery_zone)!;
  const deliveryFee = zone.fee;
  const grandTotal = total + deliveryFee;

  // Précommande : détecter si le panier contient des articles en précommande
  const hasPreorder = items.some((i: any) => i.is_preorder);
  const preorderItems = items.filter((i: any) => i.is_preorder);
  const totalRemaining = preorderItems.reduce((s: number, i: any) => s + ((i.remaining_xaf || 0) * i.quantity), 0);

  const update = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async () => {
    if (!form.customer_name || !form.phone || !form.city || !form.address) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    if (form.payment_method === "gift_card") {
      if (!form.gift_card_brand) {
        toast.error("Veuillez choisir la marque de votre carte cadeau");
        return;
      }
      if (!form.payment_reference.trim()) {
        toast.error("Veuillez saisir le code de votre carte cadeau");
        return;
      }
      if (!validateGiftCardCode(form.gift_card_brand, form.payment_reference)) {
        toast.error("Le format du code ne correspond pas à cette carte cadeau. Vérifiez et réessayez.");
        return;
      }
    }
    if (form.payment_method === "paypal" && !form.payment_reference.trim()) {
      toast.error("Veuillez indiquer votre email PayPal ou l'ID de la transaction");
      return;
    }
    if (items.length === 0) return;
    setSubmitting(true);

    // Save delivery info back to profile if logged in
    if (user) {
      await supabase.from("profiles").upsert({
        user_id: user.id,
        full_name: form.customer_name,
        phone: form.phone,
        city: form.city,
        address: form.address,
        delivery_zone: form.delivery_zone,
      }, { onConflict: "user_id" });
    }

    const { data, error } = await supabase.from("orders").insert({
      customer_name: form.customer_name,
      phone: form.phone,
      email: form.email || null,
      city: form.city,
      address: form.address,
      delivery_zone: form.delivery_zone,
      delivery_fee_xaf: deliveryFee,
      payment_method: form.payment_method,
      payment_reference: form.payment_method === "gift_card" && form.gift_card_brand
        ? `${GIFT_CARD_BRANDS.find(b => b.value === form.gift_card_brand)?.label ?? form.gift_card_brand} · ${form.payment_reference}`
        : (form.payment_reference || null),
      items: items.map(i => ({ id: i.id, name: i.name, qty: i.quantity, price_xaf: i.price_xaf })),
      subtotal_xaf: total,
      total_xaf: grandTotal,
      latitude: position?.lat ?? null,
      longitude: position?.lng ?? null,
      geo_address: geoAddress || null,
      user_id: user?.id ?? null,
      is_preorder: hasPreorder,
      deposit_amount_xaf: hasPreorder ? total : 0,
      remaining_amount_xaf: hasPreorder ? totalRemaining : 0,
    }).select("reference").single();
    setSubmitting(false);
    if (error) {
      toast.error("Erreur lors de la commande", { description: error.message });
      return;
    }
    if (form.payment_method === "crypto") {
      toast.success("Commande enregistrée", { description: "Envoyez le paiement à l'adresse crypto indiquée, notre équipe confirmera dès réception." });
    } else {
      toast.success("Commande enregistrée", { description: "Votre carte cadeau sera vérifiée par notre équipe." });
    }
    clear();
    navigate(`/order/${data.reference}`);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="container flex-1 py-20 text-center">
          <h1 className="text-2xl font-bold mb-2">{t("cart.empty")}</h1>
          <p className="text-muted-foreground mb-6">Découvrez nos produits tendance.</p>
          <Button asChild className="bg-gradient-cta"><Link to="/">{t("cart.continue")}</Link></Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-6 md:py-10">
        <div className="flex items-center gap-2 mb-6 text-sm">
          <span className={`flex items-center gap-1.5 ${step >= 1 ? "text-primary font-semibold" : "text-muted-foreground"}`}>
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step >= 1 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>1</span>
            {t("checkout.step.cart")}
          </span>
          <span className="h-px w-8 bg-border" />
          <span className={`flex items-center gap-1.5 ${step >= 2 ? "text-primary font-semibold" : "text-muted-foreground"}`}>
            <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs ${step >= 2 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>2</span>
            {t("checkout.step.delivery")}
          </span>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">

            {/* ─── BANNIÈRE PRÉCOMMANDE ─── */}
            {hasPreorder && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700 rounded-2xl p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900 dark:text-amber-200">Votre commande contient une précommande</p>
                    <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                      Vous payez <strong>l'acompte uniquement</strong> aujourd'hui. Le solde de <strong>{formatEUR(totalRemaining)}</strong> sera réglé à la livraison.
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      Expédition dès réception du stock · Remboursement possible en cas de retard important
                    </p>
                  </div>
                </div>
                {preorderItems.some((i: any) => i.remaining_xaf > 0) && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {preorderItems.map((i: any) => i.remaining_xaf > 0 && (
                      <span key={i.id} className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 px-2 py-1 rounded-full font-medium">
                        {i.name} · reste {formatEUR(i.remaining_xaf)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="bg-card rounded-2xl p-5 md:p-6 shadow-soft border border-border/50">
                <h2 className="text-lg font-bold mb-4">{t("cart.title")} ({items.length})</h2>
                <div className="space-y-4">
                  {items.map(item => (
                    <div key={item.cartKey} className="flex gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                      <Link to={`/product/${item.slug}`} className="shrink-0">
                        <img src={resolveImg(item.image_url)} alt={item.name} className="h-20 w-20 rounded-xl object-cover" />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${item.slug}`} className="font-semibold text-sm line-clamp-2 hover:text-primary">{item.name}</Link>
                        <p className="text-primary font-bold text-sm mt-1">{formatEUR(item.price_xaf)}</p>
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-border rounded-lg">
                            <button onClick={() => setQty(item.cartKey, item.quantity - 1)} className="h-8 w-8 hover:bg-muted"><Minus className="h-3 w-3 mx-auto" /></button>
                            <span className="px-3 text-sm font-medium">{item.quantity}</span>
                            <button onClick={() => setQty(item.cartKey, item.quantity + 1)} className="h-8 w-8 hover:bg-muted"><Plus className="h-3 w-3 mx-auto" /></button>
                          </div>
                          <button onClick={() => remove(item.cartKey)} className="text-muted-foreground hover:text-destructive p-1"><X className="h-4 w-4" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <Button onClick={() => setStep(2)} className="w-full mt-6 h-12 bg-gradient-cta font-semibold shadow-warm">
                  {t("checkout.continue")}
                </Button>
              </div>
            )}

            {step === 2 && (
              <>
                <div className="bg-card rounded-2xl p-5 md:p-6 shadow-soft border border-border/50">
                  <h2 className="text-lg font-bold mb-1">{t("checkout.your_info")}</h2>
                  {user && (
                    <p className="text-xs text-muted-foreground mb-4">Vos informations de livraison ont été pré-remplies depuis votre profil.</p>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>{t("checkout.full_name")} *</Label>
                      <Input value={form.customer_name} onChange={e => update("customer_name", e.target.value)} placeholder="Ex. Aïcha Ndongo" className="mt-1" />
                    </div>
                    <div>
                      <Label>{t("checkout.phone")} *</Label>
                      <Input type="tel" value={form.phone} onChange={e => update("phone", e.target.value)} placeholder="+237 6XX XX XX XX" className="mt-1" />
                    </div>
                    <div className="md:col-span-2">
                      <Label>{t("checkout.email")}</Label>
                      <Input type="email" value={form.email} onChange={e => update("email", e.target.value)} placeholder="vous@example.com" className="mt-1" />
                    </div>
                    <div>
                      <Label>{t("checkout.city")} *</Label>
                      <Input value={form.city} onChange={e => update("city", e.target.value)} placeholder="Paris, Lyon, Marseille…" className="mt-1" />
                    </div>
                    <div>
                      <Label>{t("checkout.address")} *</Label>
                      <Input value={form.address} onChange={e => update("address", e.target.value)} placeholder="Bastos, près de…" className="mt-1" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label className="flex items-center gap-1.5 mb-2"><MapPin className="h-4 w-4 text-primary" /> {t("checkout.adjust_map")} <span className="text-xs text-muted-foreground ml-1">(localisation exacte pour la livraison)</span></Label>
                    <LocationPicker value={position} onChange={(p, addr) => { setPosition(p); if (addr) setGeoAddress(addr); }} />
                  </div>
                </div>

                <div className="bg-card rounded-2xl p-5 md:p-6 shadow-soft border border-border/50">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> {t("checkout.delivery_zone")}</h2>
                  <RadioGroup value={form.delivery_zone} onValueChange={v => update("delivery_zone", v)} className="space-y-2">
                    {DELIVERY_ZONES.map(z => (
                      <label key={z.value} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-smooth ${form.delivery_zone === z.value ? "border-primary bg-primary/5" : "border-border"}`}>
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={z.value} />
                          <span className="text-sm font-medium">{z.label}</span>
                        </div>
                        <span className="text-sm font-bold text-primary">{formatEUR(z.fee)}</span>
                      </label>
                    ))}
                  </RadioGroup>
                  {form.delivery_zone === "relais" && (
                    <div className="mt-3 p-4 rounded-xl bg-primary/10 border border-primary/20 text-sm space-y-1">
                      <p className="font-bold text-primary flex items-center gap-2">
                        <MapPin className="h-4 w-4" /> {PICKUP_ADDRESS.name}
                      </p>
                      <p className="text-muted-foreground">{PICKUP_ADDRESS.address}</p>
                      <p className="text-muted-foreground">🕐 {PICKUP_ADDRESS.hours}</p>
                    </div>
                  )}
                </div>

                <div className="bg-card rounded-2xl p-5 md:p-6 shadow-soft border border-border/50">
                  <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" /> {t("checkout.payment")}</h2>
                  <RadioGroup value={form.payment_method} onValueChange={v => update("payment_method", v)} className="space-y-2">
                    {PAYMENT_METHODS.map(p => (
                      <label key={p.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-smooth ${form.payment_method === p.value ? "border-primary bg-primary/5" : "border-border"}`}>
                        <RadioGroupItem value={p.value} className="mt-0.5" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="h-6 w-6 rounded-md bg-primary flex items-center justify-center text-white text-xs font-bold">
                              {p.value === "crypto" ? <Bitcoin className="h-3.5 w-3.5" /> : p.value === "paypal" ? <Wallet className="h-3.5 w-3.5" /> : <Gift className="h-3.5 w-3.5" />}
                            </span>
                            <span className="text-sm font-semibold">{p.label}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 ml-8">{p.desc}</p>
                        </div>
                      </label>
                    ))}
                  </RadioGroup>

                  {form.payment_method === "gift_card" && (
                    <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                      <div>
                        <Label>Marque de la carte cadeau *</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-1.5">
                          {GIFT_CARD_BRANDS.map(b => (
                            <button
                              type="button"
                              key={b.value}
                              onClick={() => { update("gift_card_brand", b.value); update("payment_reference", ""); }}
                              className={`h-10 rounded-lg border text-xs font-semibold transition-smooth ${form.gift_card_brand === b.value ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card hover:border-primary/50"}`}
                            >
                              {b.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {form.gift_card_brand && (
                        <div>
                          <Label>Code de la carte {GIFT_CARD_BRANDS.find(b => b.value === form.gift_card_brand)?.label} *</Label>
                          <div className="relative mt-1">
                            <Input
                              value={form.payment_reference}
                              onChange={e => update("payment_reference", e.target.value)}
                              placeholder={`Ex. ${GIFT_CARD_BRANDS.find(b => b.value === form.gift_card_brand)?.placeholder}`}
                              className="pr-9"
                            />
                            {form.payment_reference.trim() && (
                              validateGiftCardCode(form.gift_card_brand, form.payment_reference) ? (
                                <CheckCircle2 className="h-4 w-4 text-success absolute right-3 top-1/2 -translate-y-1/2" />
                              ) : (
                                <XCircle className="h-4 w-4 text-destructive absolute right-3 top-1/2 -translate-y-1/2" />
                              )
                            )}
                          </div>
                          {form.payment_reference.trim() && !validateGiftCardCode(form.gift_card_brand, form.payment_reference) && (
                            <p className="text-xs text-destructive mt-1">Format invalide pour une carte {GIFT_CARD_BRANDS.find(b => b.value === form.gift_card_brand)?.label}. Vérifiez le code.</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1.5">Le format du code est vérifié automatiquement. Le solde est ensuite confirmé par notre équipe avant l'expédition de votre commande.</p>
                        </div>
                      )}
                    </div>
                  )}

                  {form.payment_method === "paypal" && (
                    <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                      <p className="text-xs text-muted-foreground">Envoyez le montant exact via PayPal (Paiement entre amis/famille ou Biens & Services) à :</p>
                      <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-card border border-border">
                        <p className="text-sm font-semibold font-mono">{PAYPAL_ACCOUNT}</p>
                        <button
                          type="button"
                          onClick={() => { navigator.clipboard.writeText(PAYPAL_ACCOUNT); toast.success("Email copié"); }}
                          className="p-2 rounded-lg hover:bg-muted shrink-0"
                          aria-label="Copier l'email PayPal"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div>
                        <Label>Votre email PayPal ou ID de transaction *</Label>
                        <Input
                          value={form.payment_reference}
                          onChange={e => update("payment_reference", e.target.value)}
                          placeholder="Ex. vous@email.com ou 8XT12345AB"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}

                  {form.payment_method === "crypto" && (
                    <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-3">
                      <p className="text-xs text-muted-foreground">Envoyez le montant exact à l'une des adresses ci-dessous, puis indiquez le hash de transaction :</p>
                      {CRYPTO_WALLETS.map(w => (
                        <div key={w.symbol} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-card border border-border">
                          <div className="min-w-0">
                            <p className="text-xs font-semibold">{w.name}</p>
                            <p className="text-[11px] text-muted-foreground font-mono truncate">{w.address}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => { navigator.clipboard.writeText(w.address); toast.success("Adresse copiée"); }}
                            className="p-2 rounded-lg hover:bg-muted shrink-0"
                            aria-label={`Copier l'adresse ${w.name}`}
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      <div>
                        <Label>Hash de transaction (optionnel)</Label>
                        <Input
                          value={form.payment_reference}
                          onChange={e => update("payment_reference", e.target.value)}
                          placeholder="Ex. 0x1234…"
                          className="mt-1"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1">{t("checkout.back")}</Button>
                  <Button onClick={submit} disabled={submitting} className="flex-1 h-12 bg-gradient-cta font-semibold shadow-warm">
                    {submitting ? t("checkout.sending") : `${t("checkout.confirm")} · ${formatEUR(grandTotal)}`}
                  </Button>
                </div>
              </>
            )}
          </div>

          <aside className="lg:col-span-1">
            <div className="bg-card rounded-2xl p-5 shadow-soft border border-border/50 lg:sticky lg:top-24">
              <h3 className="font-bold mb-4">{t("checkout.summary")}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">{t("checkout.subtotal")}</span><span className="font-medium">{formatEUR(total)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("checkout.delivery")}</span><span className="font-medium">{formatEUR(deliveryFee)}</span></div>
                <div className="border-t border-border pt-3 mt-3 flex justify-between text-base">
                  <span className="font-bold">{t("checkout.total")}</span>
                  <span className="font-extrabold text-primary">{formatEUR(grandTotal)}</span>
                </div>
              </div>
              <div className="mt-5 pt-5 border-t border-border space-y-2 text-xs text-muted-foreground">
                <p className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-success" /> {t("checkout.secure")}</p>
                <p className="flex items-center gap-2"><Truck className="h-3.5 w-3.5 text-primary" /> {t("checkout.express")}</p>
                <p className="flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5 text-success" /> {t("checkout.support")}</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Checkout;
