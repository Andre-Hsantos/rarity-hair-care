import { describe, expect, it } from "vitest";
import { finalPrice, promoActive } from "./pricing";

const prod = { price: 100, pro_price: 80 };
const pro = (d: number) => ({ account_type: "profissional", pro_status: "aprovado", individual_discount_percent: d });

describe("finalPrice", () => {
  it("common customer pays normal price", () => {
    expect(finalPrice(prod, { account_type: "comum", pro_status: "nao_solicitado", individual_discount_percent: 10 })).toBe(100);
  });
  it("pending professional pays normal price", () => {
    expect(finalPrice(prod, { account_type: "comum", pro_status: "em_analise", individual_discount_percent: 0 })).toBe(100);
  });
  it("approved professional pays pro price", () => expect(finalPrice(prod, pro(0))).toBe(80));
  it("individual discount applies over pro price", () => expect(finalPrice(prod, pro(10))).toBe(72));
});

describe("promotion pricing", () => {
  const common = { account_type: "comum", pro_status: "nao_solicitado", individual_discount_percent: 0 };
  const promo20 = { type: "percentual" as const, value: 20 };
  it("common customer without promotion pays 100", () => expect(finalPrice(prod, common)).toBe(100));
  it("common customer with 20% promotion pays 80", () => expect(finalPrice(prod, common, promo20)).toBe(80));
  it("professional without promotion pays 80", () => expect(finalPrice(prod, pro(0))).toBe(80));
  it("professional with 20% promotion pays 64", () => expect(finalPrice(prod, pro(0), promo20)).toBe(64));
  it("professional 10% individual + 20% promotion pays 57.60", () => expect(finalPrice(prod, pro(10), promo20)).toBe(57.6));
  it("pending professional gets promotion over the normal price only", () =>
    expect(finalPrice(prod, { account_type: "profissional", pro_status: "em_analise", individual_discount_percent: 10 }, promo20)).toBe(80));
});

describe("promoActive", () => {
  const now = new Date("2026-10-08T12:00:00Z");
  it("future promotion does not apply", () => expect(promoActive({ status: "ativo", starts_at: "2026-10-09T00:00:00Z", ends_at: null }, now)).toBe(false));
  it("expired promotion does not apply", () => expect(promoActive({ status: "ativo", starts_at: null, ends_at: "2026-10-07T00:00:00Z" }, now)).toBe(false));
  it("disabled promotion does not apply", () => expect(promoActive({ status: "inativo", starts_at: null, ends_at: null }, now)).toBe(false));
  it("promotion inside its period applies", () => expect(promoActive({ status: "ativo", starts_at: "2026-10-01T00:00:00Z", ends_at: "2026-10-31T00:00:00Z" }, now)).toBe(true));
});
