import { brl } from "@/lib/catalog";

/** Store WhatsApp (static by project rule — edit here). */
export const STORE_WHATSAPP_DISPLAY = "(27) 99757-9959";
export const STORE_WHATSAPP_DIGITS = "5527997579959";
export const whatsappLink = (text?: string) =>
  `https://wa.me/${STORE_WHATSAPP_DIGITS}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

export const ORDER_STATUSES = [
  "em_negociacao",
  "aguardando_confirmacao",
  "aguardando_pagamento",
  "pagamento_confirmado",
  "concluido",
  "cancelado",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export const statusLabel: Record<string, string> = {
  em_negociacao: "Em negociação",
  aguardando_confirmacao: "Aguardando confirmação",
  aguardando_pagamento: "Aguardando pagamento",
  pagamento_confirmado: "Pagamento confirmado",
  concluido: "Pedido concluído",
  cancelado: "Cancelado",
};
export const isFinished = (s: string) => s === "concluido" || s === "cancelado";
export const orderNumber = (id: number) => `#${id}`;

export type Quote = {
  items: {
    product_id: string; name: string; image_url: string | null; size_label: string | null; quantity: number;
    original_price: number; unit_price: number; line_total: number; in_promotion: boolean;
    coupon_eligible: boolean; coupon_note: string | null; issue: string | null; coupon_discount: number;
  }[];
  empty: boolean; has_issues: boolean; is_pro: boolean;
  products_total: number; discount: number; shipping: number | null; total: number;
  coupon: { id: string; code: string } | null; coupon_error: string | null;
};

export type AddressSnap = { street: string; number?: string; complement?: string; district?: string; city: string; state: string; zip?: string };
export const formatAddress = (a: AddressSnap | null | undefined) =>
  a ? [`${a.street}${a.number ? `, ${a.number}` : ""}${a.complement ? ` — ${a.complement}` : ""}`, a.district, `${a.city}/${a.state}`, a.zip ? `CEP ${a.zip}` : ""].filter(Boolean).join(" · ") : "";

export type WaOrder = {
  id: number; customerName: string; delivery: "entrega" | "retirada"; address: AddressSnap | null;
  items: { product_name: string; quantity: number; item_total: number }[];
  products_total: number; discount: number; shipping: number | null; total: number; coupon: string | null;
};

/** Builds the WhatsApp message strictly from the stored order. */
export function buildWhatsappMessage(o: WaOrder) {
  const lines = [
    `Olá! Gostaria de finalizar o pedido ${orderNumber(o.id)}.`,
    `Cliente: ${o.customerName}`,
    "",
    "Itens:",
    ...o.items.map((i) => `- ${i.product_name} x${i.quantity} — ${brl(Number(i.item_total))}`),
    "",
    `Subtotal: ${brl(Number(o.products_total))}`,
  ];
  if (Number(o.discount) > 0) lines.push(`Desconto${o.coupon ? ` (cupom ${o.coupon})` : ""}: - ${brl(Number(o.discount))}`);
  if (o.delivery === "retirada") lines.push("Retirada na loja: R$ 0,00");
  else {
    lines.push(`Entrega: ${o.shipping == null ? "a combinar" : brl(Number(o.shipping))}`);
    if (o.address) lines.push(`Endereço: ${formatAddress(o.address)}`);
  }
  lines.push(`Total: ${brl(Number(o.total))}${o.delivery === "entrega" && o.shipping == null ? " + entrega a combinar" : ""}`);
  return lines.join("\n");
}
