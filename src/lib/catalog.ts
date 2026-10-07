import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { finalPrice } from "@/lib/pricing";

/** Public catalog product, already priced for the current visitor. price null = "Sob consulta". */
export type Product = {
  id: string;
  name: string;
  category: string | null;
  categoryId: string | null;
  description: string;
  image: string | null;
  price: number | null;
  inStock: boolean;
  size: string | null;
  sizeGroup: string | null;
  isKit: boolean;
  proOnly: boolean;
};

export const brl = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function useCatalog() {
  const { profile, session, ready } = useAuth();
  return useQuery({
    queryKey: ["catalog", session?.user.id ?? "anon", profile?.pro_status, profile?.individual_discount_percent],
    enabled: ready,
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase.rpc("catalog_products");
      if (error) throw error;
      return (data ?? [])
        .map((r) => ({
          id: r.id,
          name: r.name,
          category: r.category_name,
          categoryId: r.category_id,
          description: r.description ?? "",
          image: r.image_url,
          price: r.price == null ? null : finalPrice({ price: Number(r.price), pro_price: r.pro_price == null ? null : Number(r.pro_price) }, profile),
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

export type HomeSection = "featured" | "best_sellers";
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
