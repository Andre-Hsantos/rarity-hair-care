import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import type { Quote } from "@/lib/orders";

/** Server-side quote of the signed-in user's cart (prices, coupon, issues are all recalculated in the database). */
export function useQuote(coupon: string, mode: "entrega" | "retirada") {
  const { session } = useAuth();
  const { cart } = useStore();
  const sig = cart.map((l) => `${l.id}:${l.qty}`).join("|");
  return useQuery({
    queryKey: ["quote", session?.user.id, sig, coupon, mode],
    enabled: !!session,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("quote_cart", { _coupon: coupon, _delivery: mode });
      if (error) throw error;
      return data as unknown as Quote;
    },
  });
}
