import { describe, expect, it } from "vitest";
import { sitemapXML } from "./sitemap";
import { DEFAULT_SITE_URL, getSiteUrl } from "./siteUrl";

describe("sitemap", () => {
  it("uses the temporary public Lovable URL as canonical default", () => {
    expect(DEFAULT_SITE_URL).toBe("https://pixel-perfect-match-1058.lovable.app");
    expect(getSiteUrl()).toBe("https://pixel-perfect-match-1058.lovable.app");
  });
  it("builds absolute, deduplicated URLs", () => {
    const xml = sitemapXML(DEFAULT_SITE_URL, [{ path: "/produto/1" }, { path: "/produto/1" }]);
    expect(xml.match(/<loc>/g)?.length).toBe(1);
    expect(xml).toContain("<loc>https://pixel-perfect-match-1058.lovable.app/produto/1</loc>");
  });
  it("rejects paths with query strings (filters/search)", () => {
    expect(() => sitemapXML(DEFAULT_SITE_URL, [{ path: "/produtos?categoria=3" }])).toThrow();
  });
});
