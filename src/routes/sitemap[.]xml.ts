import { createFileRoute } from "@tanstack/react-router";
import { getRouterInstance } from "@tanstack/react-start";
import { sitemapPathForLocation, sitemapStaticPaths, sitemapXML, isSitemapRouteIncluded, type SitemapEntry } from "@/lib/sitemap";
import { getSiteUrl } from "@/lib/siteUrl";

export const Route = createFileRoute("/sitemap.xml")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async () => {
        try {
          const router = await getRouterInstance();
          const entries: SitemapEntry[] = sitemapStaticPaths(router).map((path) => ({ path }));

          const routeId = "/produto/$id";
          if (isSitemapRouteIncluded(router.routesById[routeId])) {
            const { createClient } = await import("@supabase/supabase-js");
            const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
            const supabase = createClient(process.env["SUPABASE_URL"]!, key, {
              auth: { persistSession: false, autoRefreshToken: false },
              global: {
                fetch: (input, init) => {
                  const headers = new Headers(init?.headers);
                  if (key.startsWith("sb_") && headers.get("Authorization") === "Bearer " + key) headers.delete("Authorization");
                  headers.set("apikey", key);
                  return fetch(input, { ...init, headers });
                },
              },
            });
            // Public catalog RPC: returns only active products, visitor view (no private data).
            const pageSize = 1000;
            for (let offset = 0; ; ) {
              const { data, error } = await supabase
                .rpc("catalog_products")
                .select("id")
                .order("id")
                .range(offset, offset + pageSize - 1);
              if (error) throw error;
              const rows = (data ?? []) as { id: string }[];
              if (rows.length === 0) break;
              for (const row of rows) {
                const location = router.buildLocation({ to: "/produto/$id", params: { id: String(row.id) }, search: () => ({}), hash: "" });
                const path = sitemapPathForLocation(router, location, routeId);
                if (path) entries.push({ path });
              }
              offset += rows.length;
              if (rows.length < pageSize) break;
            }
          }

          return new Response(sitemapXML(getSiteUrl(), entries), {
            headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
          });
        } catch (e) {
          console.error("sitemap error", e);
          return new Response("Sitemap temporarily unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
        }
      },
    },
  },
});
