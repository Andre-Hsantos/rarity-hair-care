import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { PageHeader } from "@/components/site/PageHeader";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/favoritos")({ staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Favoritos — Rarity Hair Care" },
      { name: "description", content: "Os produtos Rarity que você marcou como favoritos." },
      { property: "og:title", content: "Favoritos — Rarity Hair Care" },
      { property: "og:description", content: "Seus produtos favoritos da Rarity Hair Care." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Favorites,
});

function Favorites() {
  const { favItems, ready } = useStore();
  const { session } = useAuth();
  return (
    <>
      <PageHeader title="Favoritos" crumb="Favoritos" subtitle={session ? "Salvos na sua conta." : "Salvos neste navegador. Entre na sua conta para guardá-los em qualquer dispositivo."} />
      <div className="container-site mt-10">
        {!ready ? <p className="text-sm text-muted-foreground">Carregando…</p> : favItems.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
            {favItems.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        ) : (
          <p className="text-muted-foreground">Você ainda não favoritou produtos. <Link to="/produtos" className="text-gold-deep hover:underline">Ver produtos</Link></p>
        )}
      </div>
    </>
  );
}
