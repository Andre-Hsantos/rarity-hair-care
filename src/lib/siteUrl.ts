/**
 * Public canonical origin of the site (used by sitemap.xml and robots).
 * To switch domains, set SITE_URL (server env) or VITE_SITE_URL (build env).
 */
export const DEFAULT_SITE_URL = "https://pixel-perfect-match-1058.lovable.app";

export function getSiteUrl(): string {
  const fromServer = typeof process !== "undefined" ? process.env?.["SITE_URL"] : undefined;
  const fromBuild = (import.meta as { env?: Record<string, string | undefined> }).env?.["VITE_SITE_URL"];
  const raw = (fromServer || fromBuild || DEFAULT_SITE_URL).trim();
  return new URL(raw).origin;
}
