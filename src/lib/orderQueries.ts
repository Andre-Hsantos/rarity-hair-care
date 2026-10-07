import { supabase } from "@/integrations/supabase/client";
import type { AddressSnap } from "@/lib/orders";

export async function fetchOrder(id: number) {
  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*), order_history(*), coupons(code)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error("Pedido não encontrado");
  return {
    ...data,
    delivery: data.delivery_method,
    address: (data.delivery_address as AddressSnap | null) ?? null,
    items: data.order_items,
    coupon: (data.coupons as { code: string } | null)?.code ?? null,
    history: [...data.order_history].sort((a, b) => a.created_at.localeCompare(b.created_at)),
  };
}
export type FullOrder = Awaited<ReturnType<typeof fetchOrder>>;
