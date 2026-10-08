const INVALID = new Set(["", "null", "undefined"]);

/** A product ID is valid when it is a non-empty string that is not a stringified null/undefined. */
export function isValidProductId(id: unknown): id is string {
  return typeof id === "string" && !INVALID.has(id.trim().toLowerCase());
}
