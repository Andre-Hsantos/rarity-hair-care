/**
 * Reference copy of the price rule enforced in the database (_quote_cart / catalog_products).
 * The database is the source of truth; this mirror exists to pin the rule with tests.
 * Order: applicable price (normal, or pro_price for approved pros) → individual pro discount → one promotion.
 */
export type Promo = { type: "percentual" | "valor_fixo"; value: number };

export function finalPrice(
  product: { price: number; pro_price: number | null },
  customer: { account_type: string; pro_status: string; individual_discount_percent: number } | null,
  promo?: Promo | null,
): number {
  const isPro = customer?.account_type === "profissional" && customer.pro_status === "aprovado";
  let p = round(product.price);
  if (isPro) {
    const pct = Math.min(100, Math.max(0, Number(customer.individual_discount_percent) || 0));
    p = round((product.pro_price ?? product.price) * (1 - pct / 100));
  }
  return promo ? applyPromo(p, promo) : p;
}

export function applyPromo(base: number, promo: Promo): number {
  if (promo.type === "percentual") return round(base * (1 - Math.min(100, Math.max(0, promo.value)) / 100));
  return Math.max(0, round(base - Math.max(0, promo.value)));
}

/** Promotion is active only when status is ativo and now is inside [starts_at, ends_at]. */
export function promoActive(p: { status: string; starts_at: string | null; ends_at: string | null }, now = new Date()): boolean {
  const t = now.getTime();
  return p.status === "ativo" && (!p.starts_at || Date.parse(p.starts_at) <= t) && (!p.ends_at || Date.parse(p.ends_at) >= t);
}

const round = (n: number) => Math.round(n * 100) / 100;
