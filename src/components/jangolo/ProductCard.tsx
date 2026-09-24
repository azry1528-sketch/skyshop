import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatEUR } from "@/lib/jangolo";
import { resolveImg } from "@/lib/images";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

export interface Product {
  id: string;
  slug: string;
  name: string;
  price_xaf: number;
  old_price_xaf: number | null;
  category: string;
  image_url: string;
  is_trending: boolean;
  is_promo: boolean;
  rating: number;
  reviews_count: number;
  stock: number;
}

const ProductCard = ({ product }: { product: Product }) => {
  const { add } = useCart();
  const discount = product.old_price_xaf
    ? Math.round((1 - product.price_xaf / product.old_price_xaf) * 100)
    : 0;

  return (
    <article className="group bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-card transition-smooth border border-border/50">
      <Link to={`/product/${product.slug}`} className="block relative">
        <div className="aspect-square overflow-hidden bg-muted">
          <img
            src={resolveImg(product.image_url)}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        </div>
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_promo && discount > 0 && (
            <span className="bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-1 rounded-full">
              -{discount}%
            </span>
          )}
          {product.is_trending && (
            <span className="bg-accent text-accent-foreground text-[10px] font-bold px-2 py-1 rounded-full">
              🔥 Tendance
            </span>
          )}
        </div>
        {product.stock < 15 && (
          <div className="absolute bottom-2 left-2 bg-foreground/80 text-background text-[10px] font-medium px-2 py-1 rounded-full">
            Stock limité · {product.stock}
          </div>
        )}
      </Link>

      <div className="p-3 space-y-2">
        <Link to={`/product/${product.slug}`}>
          <h3 className="text-sm font-semibold line-clamp-2 leading-snug hover:text-primary transition-smooth">
            {product.name}
          </h3>
        </Link>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Star className="h-3 w-3 fill-accent text-accent" />
          <span className="font-medium text-foreground">{product.rating}</span>
          <span>({product.reviews_count})</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-base font-bold text-primary">{formatEUR(product.price_xaf)}</span>
          {product.old_price_xaf && (
            <span className="text-xs text-muted-foreground line-through">{formatEUR(product.old_price_xaf)}</span>
          )}
        </div>
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="flex-1 h-9 text-xs font-semibold bg-gradient-cta hover:opacity-90 shadow-warm"
            onClick={() => {
              add({
                id: product.id,
                slug: product.slug,
                name: product.name,
                price_xaf: product.price_xaf,
                image_url: product.image_url,
              });
              toast.success("Ajouté au panier", { description: product.name });
            }}
          >
            Ajouter
          </Button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
