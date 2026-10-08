import { describe, expect, it } from "vitest";
import { isValidProductId } from "./productId";

describe("isValidProductId", () => {
  it("rejects null, undefined and their string forms", () => {
    for (const v of [null, undefined, "null", "NULL", "undefined", "", "   "]) expect(isValidProductId(v)).toBe(false);
  });
  it("accepts a real code", () => {
    expect(isValidProductId("algas-cachos-1l")).toBe(true);
  });
});
