import { describe, expect, it } from "vitest";
import { isValidProductId } from "./productId";

describe("isValidProductId", () => {
  it("rejects null, undefined, empty and their string forms", () => {
    for (const v of [null, undefined, "null", "NULL", "undefined", "", "   "]) expect(isValidProductId(v)).toBe(false);
  });
  it("rejects non-numeric and non-integer codes", () => {
    for (const v of ["algas-cachos-1l", "12a", "21.5", "-3", "0", "1e3"]) expect(isValidProductId(v)).toBe(false);
  });
  it("accepts a manual numeric code", () => {
    expect(isValidProductId("21919")).toBe(true);
  });
});
