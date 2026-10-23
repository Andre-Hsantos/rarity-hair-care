export type CatalogPreview = "normal" | "profissional";

/** Preview never changes identity and never applies to cart, checkout or admin data. */
export function effectiveCatalogPreview(isAdmin: boolean, mode: CatalogPreview | null, pathname: string): CatalogPreview | null {
  const storefront = pathname === "/" || pathname === "/produtos" || pathname === "/favoritos" || pathname.startsWith("/produto/");
  return isAdmin && storefront ? mode : null;
}