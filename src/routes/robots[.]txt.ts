import { createFileRoute } from "@tanstack/react-router";
import { getSiteUrl } from "@/lib/siteUrl";

// Crawl hints only — never a security mechanism (private pages are protected by login/RLS).
const RULES = `User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Twitterbot
Allow: /

User-agent: facebookexternalhit
Allow: /

User-agent: *
Allow: /
Disallow: /admin
Disallow: /checkout
Disallow: /carrinho
Disallow: /minha-conta
Disallow: /notificacoes
Disallow: /pedido/
Disallow: /redefinir-senha
`;

export const Route = createFileRoute("/robots.txt")({
  staticData: { sitemap: false },
  server: {
    handlers: {
      GET: async () =>
        new Response(`${RULES}\nSitemap: ${getSiteUrl()}/sitemap.xml\n`, {
          headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        }),
    },
  },
});
