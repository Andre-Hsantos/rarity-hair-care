import { describe, expect, it } from "vitest";
import { finalPrice } from "./pricing";

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
