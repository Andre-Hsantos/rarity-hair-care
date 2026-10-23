import { describe, expect, it } from "vitest";
import { effectiveCatalogPreview } from "./catalogPreview";

describe("admin catalog preview", () => {
  it("allows normal and professional storefront previews for admins", () => {
    expect(effectiveCatalogPreview(true, "normal", "/produtos")).toBe("normal");
    expect(effectiveCatalogPreview(true, "profissional", "/produto/21919")).toBe("profissional");
  });
  it("never enables a preview for non-admins", () => {
    expect(effectiveCatalogPreview(false, "profissional", "/produtos")).toBeNull();
  });
  it("preserves actual cart, checkout and admin pricing", () => {
    for (const path of ["/carrinho", "/checkout", "/admin/produtos", "/pedido/1"]) {
      expect(effectiveCatalogPreview(true, "profissional", path)).toBeNull();
    }
  });
});