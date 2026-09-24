import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/components/jangolo/ProductCard";

export const PRODUCTS_PER_PAGE = 12;

export const useProducts = (filter?: {
  category?: string;
  trending?: boolean;
  promo?: boolean;
  page?: number;
  pageSize?: number;
}) => {
  const page = filter?.page ?? 1;
  const pageSize = filter?.pageSize ?? PRODUCTS_PER_PAGE;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ["products", filter],
    queryFn: async () => {
      let q = supabase
        .from("products")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false });

      if (filter?.category) q = q.eq("category", filter.category);
      if (filter?.trending) q = q.eq("is_trending", true);
      if (filter?.promo) q = q.eq("is_promo", true);

      // Pagination uniquement si page est fourni
      if (filter?.page !== undefined) {
        q = q.range(from, to);
      }

      const { data, error, count } = await q;
      if (error) throw error;
      return {
        products: data as Product[],
        total: count ?? 0,
        page,
        pageSize,
        totalPages: Math.ceil((count ?? 0) / pageSize),
      };
    },
  });
};

// Rétrocompatibilité : retourne directement le tableau
export const useProductsList = (filter?: {
  category?: string;
  trending?: boolean;
  promo?: boolean;
}) => {
  return useQuery({
    queryKey: ["products-list", filter],
    queryFn: async () => {
      let q = supabase.from("products").select("*").order("created_at", { ascending: false });
      if (filter?.category) q = q.eq("category", filter.category);
      if (filter?.trending) q = q.eq("is_trending", true);
      if (filter?.promo) q = q.eq("is_promo", true);
      const { data, error } = await q;
      if (error) throw error;
      return data as Product[];
    },
  });
};

export const useProduct = (slug?: string) => {
  return useQuery({
    queryKey: ["product", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("slug", slug!).maybeSingle();
      if (error) throw error;
      return data as Product | null;
    },
  });
};
