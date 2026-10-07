/** Final price for a customer. Approved professionals get pro_price (fallback: price) minus their individual discount %. */
export function finalPrice(
  product: { price: number; pro_price: number | null },
  customer: { account_type: string; pro_status: string; individual_discount_percent: number } | null,
): number {
  const isPro = customer?.account_type === "profissional" && customer.pro_status === "aprovado";
  if (!isPro) return round(product.price);
  const base = product.pro_price ?? product.price;
  const pct = Math.min(100, Math.max(0, Number(customer.individual_discount_percent) || 0));
  return round(base * (1 - pct / 100));
}
const round = (n: number) => Math.round(n * 100) / 100;
