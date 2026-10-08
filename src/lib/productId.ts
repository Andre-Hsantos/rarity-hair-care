/** Product IDs are manual numeric codes typed by the admin (e.g. "21919"): positive integers only. */
export function isValidProductId(id: unknown): id is string {
  return typeof id === "string" && /^[1-9]\d*$/.test(id.trim());
}
