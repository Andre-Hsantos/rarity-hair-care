import { describe, expect, it } from "vitest";
import { cleanCnpj } from "./auth";

describe("CNPJ/MEI number", () => {
  it("accepts 14 digits, with or without mask", () => {
    expect(cleanCnpj("12.345.678/0001-90")).toBe("12345678000190");
    expect(cleanCnpj("12345678000190")).toBe("12345678000190");
  });
  it("rejects wrong length or empty", () => {
    expect(cleanCnpj("1234567800019")).toBeNull();
    expect(cleanCnpj("")).toBeNull();
    expect(cleanCnpj(null)).toBeNull();
  });
});
