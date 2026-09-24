import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { pixelAddToCart } from "@/lib/fbPixel";

export interface CartItem {
  id: string;
  /** Clé unique dans le panier = id produit + optionId éventuel */
  cartKey: string;
  slug: string;
  name: string;
  price_xaf: number;
  image_url: string;
  quantity: number;
  /** Nom de l'offre/bundle choisi, ex: "Pack Duo" */
  selectedOptionName?: string;
  is_preorder?: boolean;
  deposit_pct?: number;
  remaining_xaf?: number;
}

interface CartCtx {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity" | "cartKey"> & { optionId?: string }, qty?: number) => void;
  remove: (cartKey: string) => void;
  setQty: (cartKey: string, qty: number) => void;
  clear: () => void;
  total: number;
  count: number;
}

const Ctx = createContext<CartCtx | null>(null);
const STORAGE = "skyride_cart_v2";

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE) || "[]"); } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE, JSON.stringify(items));
  }, [items]);

  const add: CartCtx["add"] = ({ optionId, ...item }, qty = 1) => {
    // cartKey unique : combine l'id produit et l'optionId pour distinguer les offres
    const cartKey = optionId ? `${item.id}__${optionId}` : item.id;
    setItems((prev) => {
      const ex = prev.find((p) => p.cartKey === cartKey);
      if (ex) return prev.map((p) => p.cartKey === cartKey ? { ...p, quantity: p.quantity + qty } : p);
      return [...prev, { ...item, cartKey, quantity: qty }];
    });
    pixelAddToCart({ id: item.id, name: item.name, price_xaf: item.price_xaf }, qty);
  };
  const remove = (cartKey: string) => setItems((p) => p.filter((i) => i.cartKey !== cartKey));
  const setQty = (cartKey: string, qty: number) => {
    if (qty <= 0) return remove(cartKey);
    setItems((p) => p.map((i) => i.cartKey === cartKey ? { ...i, quantity: qty } : i));
  };
  const clear = () => setItems([]);

  // total = somme des prix unitaires × quantité (price_xaf inclut déjà l'acompte si précommande)
  const total = items.reduce((s, i) => s + i.price_xaf * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return <Ctx.Provider value={{ items, add, remove, setQty, clear, total, count }}>{children}</Ctx.Provider>;
};

export const useCart = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
};
