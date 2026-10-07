import { describe, expect, it } from "vitest";
import { buildWhatsappMessage, ORDER_STATUSES, whatsappLink } from "./orders";

describe("orders", () => {
  it("uses the store WhatsApp (27) 99757-9959", () => {
    expect(whatsappLink()).toBe("https://wa.me/5527997579959");
  });
  it("has exactly the six commercial statuses", () => {
    expect(ORDER_STATUSES).toEqual(["em_negociacao", "aguardando_confirmacao", "aguardando_pagamento", "pagamento_confirmado", "concluido", "cancelado"]);
  });
  it("delivery without shipping shows 'a combinar'; pickup shows R$ 0,00", () => {
    const base = { id: 7, customerName: "Ana", address: null, items: [{ product_name: "Máscara", quantity: 2, item_total: 50 }], products_total: 50, discount: 0, shipping: null, total: 50, coupon: null };
    expect(buildWhatsappMessage({ ...base, delivery: "entrega" })).toContain("Entrega: a combinar");
    expect(buildWhatsappMessage({ ...base, delivery: "retirada", shipping: 0 })).toContain("Retirada na loja: R$ 0,00");
    expect(buildWhatsappMessage({ ...base, delivery: "retirada" })).toContain("pedido #7");
  });
});
