import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { CATEGORIES, formatEUR } from "@/lib/jangolo";
import { resolveImg } from "@/lib/images";
import { Pencil, Trash2, Plus, Upload, ImagePlus, X, Eye, Wand2 } from "lucide-react";
import { toast } from "sonner";

const empty = {
  slug: "", name: "", description: "", long_description: "", price_xaf: 0, old_price_xaf: null as number | null,
  category: "surron-motos-electriques", image_url: "", stock: 50, is_trending: false, is_promo: false,
  is_preorder: false, preorder_label: "Prévente exclusive", preorder_date: "", preorder_deadline: "",
  preorder_max_units: "" as any, preorder_deposit_pct: 30, preorder_bonus: "",
  rating: 4.5, reviews_count: 0,
  gallery_urls: [] as string[], video_url: "", benefits: [] as string[], benefit_images: [] as string[], box_contents: [] as string[],
  specifications: {} as Record<string, string>, extra_details: "",
  options: [] as Array<{ id: string; name: string; description?: string; price_xaf: number; old_price_xaf?: number }>,
};

// Upload image to Supabase Storage (bucket: product-images)
async function uploadImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

// Upload video to Supabase Storage (bucket: product-videos)
async function uploadVideo(file: File): Promise<string> {
  const ext = file.name.split(".").pop();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from("product-videos").upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from("product-videos").getPublicUrl(path);
  return data.publicUrl;
}

const VideoUploadButton = ({ onUrl }: { onUrl: (url: string) => void }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadVideo(file);
      onUrl(url);
      toast.success("Vidéo uploadée");
    } catch (err: any) {
      toast.error("Erreur upload vidéo: " + (err.message || "inconnue"));
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <div>
      <input ref={ref} type="file" accept="video/*" className="hidden" onChange={handleFile} />
      <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => ref.current?.click()} className="gap-1.5 shrink-0">
        <Upload className="h-4 w-4" />
        {uploading ? "Upload..." : "Uploader"}
      </Button>
    </div>
  );
};

const ImageUploadButton = ({ label, onUrl }: { label: string; onUrl: (url: string) => void }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      onUrl(url);
      toast.success("Image uploadée");
    } catch (err: any) {
      toast.error("Erreur upload: " + (err.message || "inconnue"));
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => ref.current?.click()} className="gap-1.5">
        <ImagePlus className="h-4 w-4" />
        {uploading ? "Upload..." : label}
      </Button>
    </div>
  );
};

const GalleryUpload = ({ urls, onChange }: { urls: string[]; onChange: (urls: string[]) => void }) => {
  const ref = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const uploaded = await Promise.all(files.map(uploadImage));
      onChange([...urls, ...uploaded]);
      toast.success(`${uploaded.length} image(s) ajoutée(s)`);
    } catch (err: any) {
      toast.error("Erreur upload galerie: " + (err.message || "inconnue"));
    } finally {
      setUploading(false);
      if (ref.current) ref.current.value = "";
    }
  };
  return (
    <div className="space-y-2">
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      <div className="flex flex-wrap gap-2">
        {urls.map((u, i) => (
          <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border border-border">
            <img src={resolveImg(u)} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(urls.filter((_, j) => j !== i))}
              className="absolute top-0.5 right-0.5 h-4 w-4 bg-destructive text-white rounded-full flex items-center justify-center"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
        <button
          type="button"
          disabled={uploading}
          onClick={() => ref.current?.click()}
          className="h-16 w-16 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary transition-colors text-xs gap-1"
        >
          <Upload className="h-4 w-4" />
          {uploading ? "..." : "Ajouter"}
        </button>
      </div>
    </div>
  );
};

// LiA — Rédiger avec l'IA
const LiAButton = ({ form, setForm }: { form: any; setForm: any }) => {
  const [loading, setLoading] = useState(false);
  const generate = async () => {
    if (!form.name) { toast.error("Entrez d'abord un nom de produit."); return; }
    setLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("lia-generate", {
        body: { name: form.name, category: form.category, price_xaf: form.price_xaf },
      });
      if (fnError) throw new Error(fnError.message);
      const text = fnData?.content?.[0]?.text || "";
      const parsed = JSON.parse(text.trim());
      setForm((f: any) => ({
        ...f,
        description:      parsed.description      || f.description,
        long_description: parsed.long_description || f.long_description,
        benefits:         parsed.benefits?.length  ? parsed.benefits  : f.benefits,
        extra_details:    parsed.extra_details     || f.extra_details,
        specifications:   parsed.specifications    || f.specifications,
        box_contents:     parsed.box_contents?.length ? parsed.box_contents : f.box_contents,
        video_url:        parsed.video_url         || f.video_url,
      }));
      toast.success("✨ Contenu généré par LiA !");
    } catch (e: any) {
      toast.error("Erreur LiA : " + (e.message || "inconnue"));
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      type="button"
      onClick={generate}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-primary/40 text-primary font-semibold text-sm hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50"
    >
      <Wand2 className="h-4 w-4" />
      {loading ? "LiA rédige…" : "✨ Rédiger avec LiA"}
    </button>
  );
};

const Products = () => {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);
  const [optionsText, setOptionsText] = useState<string>("");

  const load = async () => {
    const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false });
    setItems(data || []);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty); setOptionsText(""); setOpen(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ ...empty, ...p, gallery_urls: p.gallery_urls || [], benefits: p.benefits || [], benefit_images: p.benefit_images || [], box_contents: p.box_contents || [], specifications: p.specifications || {}, extra_details: p.extra_details || "", video_url: p.video_url || "", long_description: p.long_description || "", options: p.options || [], is_preorder: p.is_preorder || false, preorder_label: p.preorder_label || "Prévente exclusive", preorder_date: p.preorder_date || "", preorder_deadline: p.preorder_deadline || "", preorder_max_units: p.preorder_max_units || "", preorder_deposit_pct: p.preorder_deposit_pct || 30, preorder_bonus: p.preorder_bonus || "" });
    setOptionsText((p.options || []).map((o: any) => `${o.name}|${o.description || ""}|${o.price_xaf}|${o.old_price_xaf || ""}`).join("\n"));
    setOpen(true);
  };
  const save = async () => {
    const missing: string[] = [];
    if (!form.name) missing.push("Nom");
    if (!form.slug) missing.push("Slug");
    if (!form.image_url) missing.push("Image principale");
    if (!form.gallery_urls?.length) missing.push("Galerie");
    if (!form.benefits?.length) missing.push("Avantages");
    if (!Object.keys(form.specifications || {}).length) missing.push("Spécifications");
    if (missing.length) {
      const proceed = confirm(`⚠ Champs incomplets : ${missing.join(", ")}.\n\nPublier quand même ?`);
      if (!proceed) return;
    }
    const payload = {
      ...form,
      price_xaf: Number(form.price_xaf),
      old_price_xaf: form.old_price_xaf ? Number(form.old_price_xaf) : null,
      stock: Number(form.stock),
      // Convertir les chaînes vides en null pour les champs date/number
      preorder_date: form.preorder_date || null,
      preorder_deadline: form.preorder_deadline || null,
      preorder_max_units: form.preorder_max_units ? Number(form.preorder_max_units) : null,
      preorder_bonus: form.preorder_bonus || null,
    };
    const { error } = editing
      ? await supabase.from("products").update(payload).eq("id", editing.id)
      : await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Produit mis à jour" : "Produit ajouté");
    setOpen(false); load();
  };
  const remove = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Supprimé"); load();
  };

  const setListField = (k: string, v: string) => setForm((f: any) => ({ ...f, [k]: v.split("\n").map((s: string) => s.trim()).filter(Boolean) }));
  const setSpecs = (v: string) => {
    const obj: Record<string, string> = {};
    v.split("\n").forEach(l => { const [k, ...rest] = l.split(":"); if (k && rest.length) obj[k.trim()] = rest.join(":").trim(); });
    setForm((f: any) => ({ ...f, specifications: obj }));
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Produits</h1>
          <p className="text-muted-foreground text-sm">{items.length} produit{items.length > 1 ? "s" : ""}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button onClick={openNew} className="bg-gradient-cta"><Plus className="h-4 w-4 mr-1" /> Ajouter</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden w-full">
            <DialogHeader><DialogTitle>{editing ? "Modifier" : "Nouveau"} produit</DialogTitle></DialogHeader>
            <DialogHeader><DialogTitle>{editing ? "Modifier" : "Nouveau"} produit</DialogTitle></DialogHeader>
            <div className="grid md:grid-cols-2 gap-3">
              <div><Label>Nom</Label><Input value={form.name} onChange={e => {
                const name = e.target.value;
                const slug = name.toLowerCase()
                  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                  .replace(/[^a-z0-9]+/g, "-")
                  .replace(/^-|-$/g, "");
                setForm({...form, name, slug: editing ? form.slug : slug});
              }} /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm({...form, slug: e.target.value})} /></div>
              <div><Label>Prix (€)</Label><Input type="number" value={form.price_xaf} onChange={e => setForm({...form, price_xaf: e.target.value})} /></div>
              <div><Label>Ancien prix</Label><Input type="number" value={form.old_price_xaf || ""} onChange={e => setForm({...form, old_price_xaf: e.target.value || null})} /></div>
              <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={e => setForm({...form, stock: e.target.value})} /></div>
              <div><Label>Catégorie</Label>
                <Select value={form.category} onValueChange={v => setForm({...form, category: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.slug} value={c.slug}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {/* Image principale avec upload galerie */}
              <div className="md:col-span-2 space-y-2">
                <Label>Image principale</Label>
                <div className="flex gap-2 items-center min-w-0">
                  <Input
                    value={form.image_url}
                    onChange={e => setForm({...form, image_url: e.target.value})}
                    placeholder="URL ou uploader depuis la galerie →"
                    className="flex-1 min-w-0 truncate"
                  />
                  <ImageUploadButton label="Galerie" onUrl={url => setForm((f: any) => ({ ...f, image_url: url }))} />
                </div>
                {form.image_url && (
                  <img src={resolveImg(form.image_url)} alt="preview" className="h-20 w-20 rounded-lg object-cover border border-border" />
                )}
              </div>

              <div className="md:col-span-2"><Label>Description</Label><Textarea value={form.description || ""} onChange={e => setForm({...form, description: e.target.value})} /></div>

              {/* Galerie avec upload multiple */}
              <div className="md:col-span-2">
                <Label className="mb-2 block">Galerie (photos du produit)</Label>
                <GalleryUpload
                  urls={form.gallery_urls || []}
                  onChange={urls => setForm((f: any) => ({ ...f, gallery_urls: urls }))}
                />
                <p className="text-xs text-muted-foreground mt-1">Ou entrez les URLs manuellement :</p>
                <Textarea
                  rows={2}
                  className="mt-1"
                  value={(form.gallery_urls || []).join("\n")}
                  onChange={e => setListField("gallery_urls", e.target.value)}
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <Label>Vidéo</Label>
                <div className="flex gap-2 items-center min-w-0">
                  <Input
                    placeholder="URL mp4 ou YouTube embed (optionnel)"
                    value={form.video_url || ""}
                    onChange={e => setForm({...form, video_url: e.target.value})}
                    className="flex-1 min-w-0 truncate"
                  />
                  <VideoUploadButton onUrl={url => setForm({...form, video_url: url})} />
                </div>
                {form.video_url && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-2 rounded-lg">
                    <span className="truncate flex-1">{form.video_url}</span>
                    <button type="button" onClick={() => setForm({...form, video_url: ""})} className="text-destructive hover:opacity-75 shrink-0"><X className="h-3.5 w-3.5" /></button>
                  </div>
                )}
              </div>
              {/* Benefits with images */}
              <div className="md:col-span-2 space-y-2">
                <Label>Avantages clés (avec image optionnelle)</Label>
                <div className="space-y-2">
                  {(form.benefits || []).map((b: string, i: number) => (
                    <div key={i} className="flex gap-2 items-center">
                      <div className="shrink-0">
                        {form.benefit_images?.[i] && form.benefit_images[i] !== "" ? (
                          <div className="relative h-12 w-12 rounded-lg overflow-hidden border border-border">
                            <img src={resolveImg(form.benefit_images[i])} alt="" className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
                            <button type="button"
                              onClick={() => {
                                const imgs = [...(form.benefit_images || [])];
                                imgs[i] = "";
                                setForm((f: any) => ({ ...f, benefit_images: imgs }));
                              }}
                              className="absolute top-0 right-0 h-4 w-4 bg-destructive text-white rounded-bl flex items-center justify-center"
                            ><X className="h-2.5 w-2.5" /></button>
                          </div>
                        ) : (
                          <ImageUploadButton label="📷" onUrl={(url) => {
                            const imgs = [...(form.benefit_images || [])];
                            while (imgs.length <= i) imgs.push("");
                            imgs[i] = url;
                            setForm((f: any) => ({ ...f, benefit_images: imgs }));
                          }} />
                        )}
                      </div>
                      <input
                        className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        value={b}
                        onChange={e => {
                          const arr = [...(form.benefits || [])];
                          arr[i] = e.target.value;
                          setForm((f: any) => ({ ...f, benefits: arr }));
                        }}
                        placeholder={`Avantage ${i + 1}…`}
                      />
                      <button type="button"
                        onClick={() => {
                          const arr = (form.benefits || []).filter((_: string, j: number) => j !== i);
                          const imgs = (form.benefit_images || []).filter((_: string, j: number) => j !== i);
                          setForm((f: any) => ({ ...f, benefits: arr, benefit_images: imgs }));
                        }}
                        className="h-9 w-9 rounded-lg border border-destructive/30 text-destructive flex items-center justify-center hover:bg-destructive/10"
                      ><X className="h-3.5 w-3.5" /></button>
                    </div>
                  ))}
                  <button type="button"
                    onClick={() => setForm((f: any) => ({ ...f, benefits: [...(f.benefits || []), ""], benefit_images: [...(f.benefit_images || []), ""] }))}
                    className="h-9 px-4 rounded-lg border-2 border-dashed border-border text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                  >+ Ajouter un avantage</button>
                </div>
              </div>
              <div className="md:col-span-2"><Label>Spécifications (clé: valeur, une par ligne)</Label><Textarea rows={3} value={Object.entries(form.specifications || {}).map(([k,v]) => `${k}: ${v}`).join("\n")} onChange={e => setSpecs(e.target.value)} /></div>
              <div className="md:col-span-2"><Label>Contenu du carton (un par ligne)</Label><Textarea rows={2} value={(form.box_contents || []).join("\n")} onChange={e => setListField("box_contents", e.target.value)} /></div>
              <div className="md:col-span-2"><Label>Détails supplémentaires</Label><Textarea value={form.extra_details || ""} onChange={e => setForm({...form, extra_details: e.target.value})} /></div>
              <div className="md:col-span-2">
                <Label>Description longue (visible sur la fiche produit)</Label>
                <Textarea rows={4} value={form.long_description || ""} onChange={e => setForm({...form, long_description: e.target.value})} placeholder="Description détaillée du produit…" />
              </div>
              <div className="md:col-span-2">
                <Label className="mb-1 block">Options / Bundles (ex: Pack Solo, Pack Duo…)</Label>
                <p className="text-xs text-muted-foreground mb-2">Un bundle par ligne au format : <code>Nom | Description | Prix | Ancien prix</code></p>
                <Textarea
                  rows={4}
                  placeholder={"Pack Solo | 1 casque + antivol | 85 | 95\nPack Duo | 2 chargeurs + housse | 160"}
                  value={optionsText}
                  onChange={e => {
                    const txt = e.target.value;
                    setOptionsText(txt);
                    const opts = txt.split("\n").filter(Boolean).map((l, i) => {
                      const [name, description, price_xaf, old_price_xaf] = l.split("|").map(s => s.trim());
                      return { id: String(i + 1), name: name || "", description: description || undefined, price_xaf: Number(price_xaf) || 0, old_price_xaf: old_price_xaf ? Number(old_price_xaf) : undefined };
                    });
                    setForm((f: any) => ({ ...f, options: opts }));
                  }}
                />
              </div>
              <label className="flex items-center gap-2"><Switch checked={form.is_trending} onCheckedChange={v => setForm({...form, is_trending: v})} /> Tendance</label>
              <label className="flex items-center gap-2"><Switch checked={form.is_promo} onCheckedChange={v => setForm({...form, is_promo: v})} /> Promo</label>
              <label className="flex items-center gap-2"><Switch checked={!!form.is_preorder} onCheckedChange={v => setForm({...form, is_preorder: v})} /> <span className="text-primary font-semibold">Précommande</span></label>

            {/* ─── Champs précommande ─── */}
            {form.is_preorder && (
              <div className="md:col-span-2 border border-primary/30 bg-primary/5 rounded-2xl p-4 space-y-3">
                <p className="text-sm font-bold text-primary">⚙️ Configuration Précommande</p>
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Label affiché</Label>
                    <select
                      className="w-full mt-1 h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none"
                      value={form.preorder_label || "Prévente exclusive"}
                      onChange={e => setForm({...form, preorder_label: e.target.value})}
                    >
                      {["Prévente exclusive","Arrivage en cours","Réservation ouverte","Livraison du prochain lot","Stock limité","Édition limitée"].map(l => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label className="text-xs">Acompte (%)</Label>
                    <Input type="number" min={10} max={100}
                      value={form.preorder_deposit_pct || 30}
                      onChange={e => setForm({...form, preorder_deposit_pct: Number(e.target.value)})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Date de livraison estimée</Label>
                    <Input type="date" value={form.preorder_date || ""}
                      onChange={e => setForm({...form, preorder_date: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Clôture précommande (deadline)</Label>
                    <Input type="datetime-local" value={form.preorder_deadline ? form.preorder_deadline.slice(0,16) : ""}
                      onChange={e => setForm({...form, preorder_deadline: e.target.value})}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Unités max (stock limité)</Label>
                    <Input type="number" min={1}
                      value={form.preorder_max_units || ""}
                      onChange={e => setForm({...form, preorder_max_units: e.target.value ? Number(e.target.value) : ""})}
                      placeholder="Ex: 10"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Bonus précommande</Label>
                    <Input
                      value={form.preorder_bonus || ""}
                      onChange={e => setForm({...form, preorder_bonus: e.target.value})}
                      placeholder="Ex: Mini formation offerte + hélices de rechange"
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            )}
            </div>
            <LiAButton form={form} setForm={setForm} />
            <Button onClick={save} className="w-full bg-gradient-cta">Enregistrer</Button>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barre de recherche avec autocomplétion */}
      <div className="relative">
        <Input
          placeholder="Rechercher un produit par nom ou catégorie…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full"
        />
        {search.length > 0 && items.filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase())).length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden max-h-56 overflow-y-auto">
            {items
              .filter(p => p.name?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase()))
              .slice(0, 8)
              .map(p => (
                <button
                  key={p.id}
                  type="button"
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-muted text-left transition-colors"
                  onClick={() => { setSearch(p.name); }}
                >
                  <img src={resolveImg(p.image_url)} alt={p.name} className="h-8 w-8 rounded-lg object-cover shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.category} · {formatEUR(p.price_xaf)}</p>
                  </div>
                </button>
              ))}
          </div>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.filter(p => !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.category?.toLowerCase().includes(search.toLowerCase())).map(p => {
          const missing = [
            !p.gallery_urls?.length && "Galerie",
            !p.benefits?.length && "Avantages",
            !Object.keys(p.specifications || {}).length && "Spécifs",
          ].filter(Boolean) as string[];
          return (
          <div key={p.id} className="bg-card rounded-2xl p-3 border border-border/50 shadow-soft">
            <img src={resolveImg(p.image_url)} alt={p.name} className="w-full aspect-square rounded-xl object-cover mb-3" />
            <p className="font-semibold text-sm line-clamp-1">{p.name}</p>
            <p className="text-primary font-bold text-sm">{formatEUR(p.price_xaf)}</p>
            <p className="text-xs text-muted-foreground">Stock: {p.stock} · {p.category}</p>
            {missing.length > 0 ? (
              <p className="mt-2 text-[10px] text-destructive font-semibold">⚠ Manque: {missing.join(", ")}</p>
            ) : (
              <p className="mt-2 text-[10px] text-success font-semibold">✓ Fiche complète</p>
            )}
            <div className="flex gap-2 mt-3">
              <Button size="sm" variant="outline" className="flex-1" onClick={() => openEdit(p)}><Pencil className="h-3 w-3 mr-1" /> Modifier</Button>
              <Button size="sm" variant="outline" asChild title="Prévisualiser"><a href={`/product/${p.slug}`} target="_blank" rel="noreferrer"><Eye className="h-3 w-3 text-primary" /></a></Button>
              <Button size="sm" variant="outline" onClick={() => remove(p.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
};

export default Products;
