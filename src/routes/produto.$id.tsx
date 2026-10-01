import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Check, ChevronRight, Heart, Minus, Plus, Star } from "lucide-react";
import { brl, getProduct, products } from "@/lib/products";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/produto/$id")({
  loader: ({ params }) => {
    const p = getProduct(params.id);
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Produto"} — Rarity Hair Care` },
      { name: "description", content: loaderData?.short ?? "Produto Rarity Hair Care" },
      { property: "og:title", content: `${loaderData?.name ?? "Produto"} — Rarity` },
      { property: "og:description", content: loaderData?.short ?? "" },
    ],
  }),
  component: ProductPage,
});

const reviews = [
  { name: "Cliente A.", stars: 5, text: "Avaliação demonstrativa: deixou meus fios macios e com brilho." },
  { name: "Cliente M.", stars: 4, text: "Avaliação demonstrativa: textura agradável e perfume suave." },
];

function ProductPage() {
  const p = Route.useLoaderData();
  const { add, toggleFav, favorites } = useStore();
  const [qty, setQty] = useState(1);
  const fav = favorites.includes(p.id);
  const related = products.filter((x) => x.id !== p.id).slice(0, 4);

  return (
    <div className="container-site">
      <nav aria-label="Você está em" className="flex items-center gap-1.5 py-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Início</Link><ChevronRight className="size-3" />
        <Link to="/produtos" className="hover:text-foreground">Produtos</Link><ChevronRight className="size-3" />
        <span className="truncate text-foreground">{p.name}</span>
      </nav>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="overflow-hidden rounded-2xl border bg-surface">
          <img src={p.image} alt={p.name} width={816} height={816} className="aspect-square w-full object-cover" />
        </div>
        <div className="lg:py-6">
          <p className="eyebrow text-gold-deep">{p.category}</p>
          <h1 className="mt-3 text-4xl sm:text-5xl">{p.name}</h1>
          <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-4 ${i < Math.round(p.rating) ? "fill-gold text-gold" : "text-border"}`} />)}</span>
            {p.rating} · {reviews.length} avaliações
          </div>
          <p className="mt-6 leading-relaxed text-muted-foreground">{p.description}</p>
          <div className="mt-6 flex items-baseline gap-3">
            <span className="text-3xl font-medium">{brl(p.price)}</span>
            {p.oldPrice && <span className="text-muted-foreground line-through">{brl(p.oldPrice)}</span>}
          </div>
          <p className={`mt-2 flex items-center gap-1.5 text-sm ${p.inStock ? "text-success" : "text-destructive"}`}>
            {p.inStock ? <><Check className="size-4" /> Em estoque</> : "Indisponível no momento"}
          </p>

          <div className="mt-8">
            <p className="eyebrow text-muted-foreground">Tamanho</p>
            <div className="mt-3 flex gap-2">
              <span className="rounded-md border-2 border-gold px-4 py-2 text-sm">{p.size}</span>
              <span className="rounded-md border px-4 py-2 text-sm text-muted-foreground">Refil (em breve)</span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <div className="flex h-12 items-center rounded-md border">
              <button aria-label="Diminuir" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-full w-11 place-items-center hover:bg-accent disabled:opacity-40" disabled={qty <= 1}><Minus className="size-4" /></button>
              <span className="w-8 text-center text-sm" aria-live="polite">{qty}</span>
              <button aria-label="Aumentar" onClick={() => setQty((q) => q + 1)} className="grid h-full w-11 place-items-center hover:bg-accent"><Plus className="size-4" /></button>
            </div>
            <Button variant="gold" size="lg" className="flex-1" disabled={!p.inStock} onClick={() => add(p, qty)}>Adicionar ao carrinho</Button>
            <Button variant="outline" size="lg" className="px-4" aria-pressed={fav} aria-label="Favoritar" onClick={() => toggleFav(p)}>
              <Heart className={fav ? "fill-gold text-gold" : ""} />
            </Button>
          </div>
        </div>
      </div>

      <section className="mt-20 grid gap-10 lg:grid-cols-[1fr_2fr]">
        <div>
          <h2 className="text-3xl">Avaliações</h2>
          <p className="mt-2 text-5xl font-display">{p.rating}</p>
          <p className="text-sm text-muted-foreground">média de avaliações (demonstrativo)</p>
        </div>
        <div className="space-y-4">
          {reviews.map((r) => (
            <div key={r.name} className="rounded-xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <p className="font-medium">{r.name}</p>
                <span className="flex">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={`size-3.5 ${i < r.stars ? "fill-gold text-gold" : "text-border"}`} />)}</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-20">
        <h2 className="text-3xl">Você também pode gostar</h2>
        <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
          {related.map((x) => <ProductCard key={x.id} p={x} />)}
        </div>
      </section>
    </div>
  );
}
