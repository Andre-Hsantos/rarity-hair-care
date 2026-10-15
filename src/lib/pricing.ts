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
  qty = 1,
  tiers: Tier[] = [],
): number {
  const isPro = customer?.account_type === "profissional" && customer.pro_status === "aprovado";
  const pct = isPro ? Math.min(100, Math.max(0, Number(customer.individual_discount_percent) || 0)) : 0;
  const eff = Math.max(pct, tierPercent(tiers, qty));
  const base = isPro ? product.pro_price ?? product.price : product.price;
  const p = round(base * (1 - eff / 100));
  return promo ? applyPromo(p, promo) : p;
}

export type Tier = { min: number; pct: number; active?: boolean };

/** Largest active tier reached by the quantity (0 when none). */
export function tierPercent(tiers: Tier[], qty: number): number {
  return tiers.filter((t) => t.active !== false && t.min <= qty).reduce((m, t) => Math.max(m, t.pct), 0);
}

/** Same limits enforced by the database. Returns an error message or null. */
export function validateTier(min: number, pct: number): string | null {
  if (!Number.isInteger(min) || min < 2 || min > 99) return "Quantidade mínima deve ser de 2 a 99.";
  if (!(pct > 0) || pct > 100) return "Percentual deve ser maior que 0 e até 100.";
  return null;
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
