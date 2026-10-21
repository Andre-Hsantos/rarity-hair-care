import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

/** Public catalog product, already priced for the current visitor. price null = "Sob consulta". */
export type Product = {
  id: string;
  name: string;
  category: string | null;
  categoryId: string | null;
  /** All categories the product belongs to (principal included). */
  categoryIds: string[];
  description: string;
  image: string | null;
  price: number | null;
  /** Price before promotion (only meaningful when inPromotion). */
  originalPrice: number | null;
  inPromotion: boolean;
  /** Normal (non-pro) price; set only for approved professionals so the saving can be shown. */
  normalPrice: number | null;
  inStock: boolean;
  size: string | null;
  sizeGroup: string | null;
  isKit: boolean;
  proOnly: boolean;
};

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function useCatalog() {
  const { profile, session, ready, tier } = useAuth();
  const isPro = tier === "profissional_aprovado";
  return useQuery({
    queryKey: ["catalog", session?.user.id ?? "anon", isPro, profile?.pro_status, profile?.individual_discount_percent],
    enabled: ready,
    queryFn: async (): Promise<Product[]> => {
      const [{ data, error }, links] = await Promise.all([
        supabase.rpc("catalog_products"),
        supabase.from("product_categories").select("product_id, category_id"),
      ]);
      if (error) throw error;
      const extra = new Map<string, string[]>();
      for (const l of links.data ?? []) extra.set(l.product_id, [...(extra.get(l.product_id) ?? []), l.category_id]);
      return (data ?? [])
        .map((r) => ({
          id: r.id,
          name: r.name,
          category: r.category_name,
          categoryId: r.category_id,
          categoryIds: [...new Set([...(r.category_id ? [r.category_id] : []), ...(extra.get(r.id) ?? [])])],
          description: r.description ?? "",
          image: r.image_url,
          // Final price comes from the database (same rule as the cart); never recomputed here.
          price: r.final_price == null ? null : Number(r.final_price),
          originalPrice: r.original_price == null ? null : Number(r.original_price),
          inPromotion: r.final_price != null && r.in_promotion && Number(r.final_price) < Number(r.original_price),
          normalPrice: isPro && r.price != null && r.final_price != null && Number(r.price) > Number(r.final_price) ? Number(r.price) : null,
          inStock: r.availability === "disponivel",
          size: r.size_label,
          sizeGroup: r.size_group,
          isKit: r.is_kit,
          proOnly: r.audience === "profissionais",
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    },
  });
}

export function usePublicCategories() {
  return useQuery({
    queryKey: ["public-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id, name").eq("status", "ativo").order("display_order").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export type HomeSection = "featured" | "best_sellers" | "professional";
export function useHomeSection(section: HomeSection) {
  const catalog = useCatalog();
  const sel = useQuery({
    queryKey: ["home-section", section],
    queryFn: async () => {
      const { data, error } = await supabase.from("home_section_products").select("product_id").eq("section", section).order("position");
      if (error) throw error;
      return data.map((d) => d.product_id);
    },
  });
  const byId = new Map((catalog.data ?? []).map((p) => [p.id, p]));
  return (sel.data ?? []).map((id) => byId.get(id)).filter((p): p is Product => !!p);
}

/** Price to show struck-through: normal price for approved pros, else pre-promotion price. */
export function strikePrice(p: Product): number | null {
  if (p.price == null) return null;
  if (p.normalPrice != null) return p.normalPrice;
  return p.inPromotion && p.originalPrice != null ? p.originalPrice : null;
}
