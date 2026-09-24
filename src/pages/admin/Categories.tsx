import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, ImagePlus, ChevronDown, ChevronRight, GripVertical, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Category = {
  id: string;
  slug: string;
  label: string;
  parent_slug: string | null;
  image_url: string | null;
  position: number;
};

const slugify = (s: string) =>
  s.toLowerCase().trim()
    .replace(/[àáâä]/g, "a").replace(/[éèêë]/g, "e").replace(/[îï]/g, "i")
    .replace(/[ôö]/g, "o").replace(/[ùûü]/g, "u").replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const AdminCategories = () => {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);

  // New category form
  const [newLabel, setNewLabel] = useState("");
  const [newParent, setNewParent] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadTarget, setUploadTarget] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("position");
    if (error) toast.error(error.message);
    else setCats(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const roots = cats.filter(c => !c.parent_slug);
  const children = (parentSlug: string) => cats.filter(c => c.parent_slug === parentSlug);

  const toggleExpand = (slug: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(slug) ? next.delete(slug) : next.add(slug);
      return next;
    });
  };

  const startEdit = (cat: Category) => {
    setEditId(cat.id);
    setEditLabel(cat.label);
    setEditSlug(cat.slug);
  };

  const saveEdit = async (cat: Category) => {
    const { error } = await supabase
      .from("categories")
      .update({ label: editLabel, slug: editSlug })
      .eq("id", cat.id);
    if (error) return toast.error(error.message);
    toast.success("Catégorie mise à jour");
    setEditId(null);
    load();
  };

  const deleteCategory = async (cat: Category) => {
    const hasChildren = cats.some(c => c.parent_slug === cat.slug);
    if (hasChildren) {
      return toast.error("Supprimez d'abord les sous-catégories.");
    }
    if (!confirm(`Supprimer "${cat.label}" ?`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", cat.id);
    if (error) return toast.error(error.message);
    toast.success("Catégorie supprimée");
    load();
  };

  const addCategory = async () => {
    if (!newLabel.trim()) return toast.error("Entrez un nom.");
    setAdding(true);
    const slug = slugify(newLabel);
    const position = newParent
      ? children(newParent).length + 1
      : roots.length + 1;
    const { error } = await supabase.from("categories").insert({
      slug, label: newLabel.trim(), parent_slug: newParent, position,
    });
    if (error) { toast.error(error.message); }
    else {
      toast.success("Catégorie ajoutée");
      setNewLabel("");
      setNewParent(null);
      if (newParent) setExpanded(prev => new Set([...prev, newParent]));
      load();
    }
    setAdding(false);
  };

  const uploadImage = async (catId: string, file: File) => {
    setUploading(catId);
    const ext = file.name.split(".").pop();
    const path = `${catId}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("category-images")
      .upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); setUploading(null); return; }

    const { data: urlData } = supabase.storage.from("category-images").getPublicUrl(path);
    const { error: dbErr } = await supabase
      .from("categories")
      .update({ image_url: urlData.publicUrl })
      .eq("id", catId);
    if (dbErr) toast.error(dbErr.message);
    else toast.success("Photo mise à jour");
    setUploading(null);
    setUploadTarget(null);
    load();
  };

  const CategoryRow = ({ cat, depth = 0 }: { cat: Category; depth?: number }) => {
    const subs = children(cat.slug);
    const isExpanded = expanded.has(cat.slug);
    const isEditing = editId === cat.id;

    return (
      <div>
        <div
          className={`flex items-center gap-2 px-4 py-2.5 border-b border-border hover:bg-muted/40 transition-smooth ${depth > 0 ? "pl-10 bg-muted/20" : ""}`}
        >
          {/* Expand toggle */}
          <button
            onClick={() => subs.length > 0 && toggleExpand(cat.slug)}
            className={`shrink-0 ${subs.length > 0 ? "text-muted-foreground hover:text-foreground" : "text-transparent"}`}
          >
            {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>

          {/* Image */}
          <div className="relative shrink-0">
            <div className="h-10 w-10 rounded-lg overflow-hidden bg-muted border border-border">
              {cat.image_url
                ? <img src={cat.image_url} alt={cat.label} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">IMG</div>
              }
            </div>
            <button
              onClick={() => { setUploadTarget(cat.id); fileRef.current?.click(); }}
              className="absolute -bottom-1 -right-1 h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow"
            >
              <ImagePlus className="h-2.5 w-2.5" />
            </button>
          </div>

          {/* Label / Slug edit */}
          {isEditing ? (
            <div className="flex-1 flex items-center gap-2 flex-wrap">
              <Input
                value={editLabel}
                onChange={e => { setEditLabel(e.target.value); setEditSlug(slugify(e.target.value)); }}
                className="h-8 text-sm flex-1 min-w-[120px]"
                placeholder="Nom"
              />
              <Input
                value={editSlug}
                onChange={e => setEditSlug(e.target.value)}
                className="h-8 text-xs flex-1 min-w-[100px] font-mono"
                placeholder="slug"
              />
              <button onClick={() => saveEdit(cat)} className="text-success hover:opacity-80"><Check className="h-4 w-4" /></button>
              <button onClick={() => setEditId(null)} className="text-muted-foreground hover:opacity-80"><X className="h-4 w-4" /></button>
            </div>
          ) : (
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{cat.label}</p>
              <p className="text-[11px] text-muted-foreground font-mono">{cat.slug}</p>
            </div>
          )}

          {/* Sub count */}
          {subs.length > 0 && (
            <Badge variant="secondary" className="text-[10px] shrink-0">{subs.length} sous-cat.</Badge>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => startEdit(cat)} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-smooth">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => deleteCategory(cat)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-smooth">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Children */}
        {isExpanded && subs.map(sub => (
          <CategoryRow key={sub.id} cat={sub} depth={depth + 1} />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Catégories</h1>
        <p className="text-muted-foreground text-sm">{cats.length} catégorie{cats.length > 1 ? "s" : ""} au total</p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0];
          if (file && uploadTarget) uploadImage(uploadTarget, file);
          e.target.value = "";
        }}
      />

      {/* Add category form */}
      <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
        <p className="text-sm font-bold">Ajouter une catégorie</p>
        <div className="flex gap-2 flex-wrap">
          <Input
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="Nom de la catégorie"
            className="flex-1 min-w-[180px]"
            onKeyDown={e => e.key === "Enter" && addCategory()}
          />
          <select
            value={newParent ?? ""}
            onChange={e => setNewParent(e.target.value || null)}
            className="flex-1 min-w-[160px] rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">— Catégorie racine —</option>
            {roots.map(r => (
              <option key={r.slug} value={r.slug}>{r.label}</option>
            ))}
          </select>
          <Button onClick={addCategory} disabled={adding || !newLabel.trim()} className="gap-1">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
        {newLabel && (
          <p className="text-xs text-muted-foreground">Slug généré : <code className="bg-muted px-1 rounded">{slugify(newLabel)}</code></p>
        )}
      </div>

      {/* Category tree */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="hidden md:grid grid-cols-12 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-muted-foreground border-b border-border bg-muted/30">
          <div className="col-span-1"></div>
          <div className="col-span-1">Photo</div>
          <div className="col-span-7">Nom / Slug</div>
          <div className="col-span-2">Sous-catégories</div>
          <div className="col-span-1">Actions</div>
        </div>

        {loading && <p className="p-6 text-center text-muted-foreground text-sm">Chargement…</p>}

        {!loading && roots.map(cat => (
          <CategoryRow key={cat.id} cat={cat} />
        ))}

        {!loading && roots.length === 0 && (
          <p className="p-8 text-center text-muted-foreground text-sm">Aucune catégorie. Ajoutez-en une ci-dessus.</p>
        )}
      </div>

      {uploading && (
        <p className="text-xs text-muted-foreground text-center">Upload en cours…</p>
      )}
    </div>
  );
};

export default AdminCategories;
