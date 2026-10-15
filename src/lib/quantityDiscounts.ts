import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Active quantity tiers of a product (public read; prices are still computed in the database). */
export function useQuantityTiers(productId: string) {
  return useQuery({
    queryKey: ["qty-tiers", productId],
    queryFn: async () => {
      const { data, error } = await supabase.from("quantity_discounts").select("min_quantity, percent")
        .eq("product_id", productId).eq("status", "ativo").order("min_quantity");
      if (error) throw error;
      return data.map((t) => ({ min: t.min_quantity, pct: Number(t.percent) }));
    },
  });
}

export const pctLabel = (n: number) => `${String(n).replace(".", ",")}%`;
