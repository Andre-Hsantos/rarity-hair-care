import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronRight, Heart, ImageOff, MessageCircle, Minus, Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { brl, strikePrice, useCatalog } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { pctLabel, useQuantityTiers } from "@/lib/quantityDiscounts";
import { Button, buttonVariants } from "@/components/ui/button";
import { ProductCard } from "@/components/site/ProductCard";

export const Route = createFileRoute("/produto/$id")({
  head: () => ({
    meta: [
      { title: "Produto — Rarity Hair Care" },
      { name: "description", content: "Detalhes do produto Rarity Hair Care: descrição, tamanhos e preço." },
      { property: "og:title", content: "Produto — Rarity Hair Care" },
      { property: "og:description", content: "Conheça este cuidado capilar da linha Rarity." },
      { property: "og:type", content: "product" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const catalog = useCatalog();
  const { add, toggleFav, favorites } = useStore();
  const [qty, setQty] = useState(1);
  const all = catalog.data ?? [];
  const p = all.find((x) => x.id === id);
  const kit = useQuery({
    queryKey: ["kit-items", id],
    enabled: !!p?.isKit,
    queryFn: async () => {
      const { data, error } = await supabase.from("kit_items").select("product_id, quantity").eq("kit_id", id);
      if (error) throw error;
      return data;
    },
  }).data;
  const tiers = useQuantityTiers(id).data;

  if (catalog.isLoading || !catalog.data) return <div className="container-site py-20 text-sm text-muted-foreground">Carregando…</div>;
  if (!p)
    return (
      <div className="container-site py-24 text-center">
        <p className="font-display text-4xl">Produto não encontrado</p>
        <p className="mt-2 text-sm text-muted-foreground">Ele pode ter sido removido ou estar indisponível.</p>
        <Link to="/produtos" className={buttonVariants({ variant: "gold", className: "mt-6" })}>Ver produtos</Link>
      </div>
    );

  const fav = favorites.includes(p.id);
  const sizes = p.sizeGroup ? all.filter((x) => x.sizeGroup === p.sizeGroup) : [];
  const related = all.filter((x) => x.id !== p.id && x.categoryIds.some((c) => p.categoryIds.includes(c))).slice(0, 4);
  const nameOf = (pid: string) => all.find((x) => x.id === pid)?.name ?? pid;

  return (
    <div className="container-site">
      <nav aria-label="Você está em" className="flex items-center gap-1.5 py-6 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Início</Link><ChevronRight className="size-3" />
        <Link to="/produtos" className="hover:text-foreground">Produtos</Link><ChevronRight className="size-3" />
        <span className="truncate text-foreground">{p.name}</span>
      </nav>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="overflow-hidden rounded-2xl border bg-surface">
          {p.image ? (
            <img src={p.image} alt={p.name} width={816} height={816} className="aspect-square w-full object-cover" />
          ) : (
            <div className="grid aspect-square place-items-center text-muted-foreground"><ImageOff className="size-10" strokeWidth={1.25} /></div>
          )}
        </div>
        <div className="lg:py-6">
          <p className="eyebrow text-gold-deep">{p.category ?? (p.isKit ? "Kit" : "Rarity")}{p.proOnly && " · Profissional"}</p>
          <h1 className="mt-3 text-4xl sm:text-5xl">{p.name}</h1>
          {p.description && <p className="mt-6 whitespace-pre-line leading-relaxed text-muted-foreground">{p.description}</p>}
          <div className="mt-6 flex items-baseline gap-3">
            {strikePrice(p) != null && <span className="text-lg text-muted-foreground">De <s>{brl(strikePrice(p)!)}</s></span>}
            <span className="text-3xl font-medium">{p.price == null ? "Sob consulta" : <>{strikePrice(p) != null && <span className="text-lg font-normal text-gold-deep">Por </span>}{brl(p.price)}</>}</span>
            {p.inPromotion && <span className="rounded-full bg-gold px-2.5 py-1 text-xs font-medium text-ink">Promoção</span>}
          </div>
          <p className={`mt-2 flex items-center gap-1.5 text-sm ${p.inStock ? "text-success" : "text-destructive"}`}>
            {p.inStock ? <><Check className="size-4" /> Disponível</> : "Esgotado no momento"}
          </p>
          {p.price != null && !!tiers?.length && (
            <div className="mt-6 rounded-lg border border-gold/40 bg-gold/5 p-4">
              <p className="eyebrow text-gold-deep">Leve mais, pague menos</p>
              {(() => { const hit = tiers.filter((t) => qty >= t.min).pop(); const next = tiers.find((t) => qty < t.min);
                return hit ? (
                  <p className="mt-3 flex items-center gap-2 rounded-md bg-success/10 px-3 py-2 text-sm font-medium text-success"><Check className="size-4" /> Desconto de {pctLabel(hit.pct)} aprovado para {qty} unidades!</p>
                ) : next ? (
                  <p className="mt-3 text-sm">Adicione mais <strong>{next.min - qty}</strong> {next.min - qty === 1 ? "unidade" : "unidades"} para ganhar {pctLabel(next.pct)} de desconto.</p>
                ) : null; })()}
              <ul className="mt-2 space-y-1 text-sm">
                {tiers.map((t) => <li key={t.min} className={qty >= t.min ? "font-medium" : "text-muted-foreground"}>A partir de {t.min} un.: {pctLabel(t.pct)} de desconto</li>)}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">Vale a maior faixa atingida. Para profissionais, aplica-se o maior entre esta faixa e o seu desconto individual. O valor final aparece no carrinho.</p>
            </div>
          )}

          {sizes.length > 1 ? (
            <div className="mt-8">
              <p className="eyebrow text-muted-foreground">Tamanho</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((s) => (
                  <Link key={s.id} to="/produto/$id" params={{ id: s.id }} className={`rounded-md px-4 py-2 text-sm ${s.id === p.id ? "border-2 border-gold" : "border text-muted-foreground hover:bg-accent"}`}>
                    {s.size ?? s.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : p.size ? (
            <div className="mt-8">
              <p className="eyebrow text-muted-foreground">Tamanho</p>
              <span className="mt-3 inline-block rounded-md border-2 border-gold px-4 py-2 text-sm">{p.size}</span>
            </div>
          ) : null}

          {p.isKit && !!kit?.length && (
            <div className="mt-8">
              <p className="eyebrow text-muted-foreground">Itens do kit</p>
              <ul className="mt-3 space-y-1.5 text-sm">
                {kit.map((k) => <li key={k.product_id}>{k.quantity}× {nameOf(k.product_id)}</li>)}
              </ul>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3">
            {p.price == null ? (
              <Link to="/contato" className={buttonVariants({ variant: "gold", size: "lg", className: "flex-1" })}><MessageCircle /> Consultar preço</Link>
            ) : (
              <>
                <div className="flex h-12 items-center rounded-md border">
                  <button aria-label="Diminuir" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-full w-11 place-items-center hover:bg-accent disabled:opacity-40" disabled={qty <= 1}><Minus className="size-4" /></button>
                  <span className="w-8 text-center text-sm" aria-live="polite">{qty}</span>
                  <button aria-label="Aumentar" onClick={() => setQty((q) => q + 1)} className="grid h-full w-11 place-items-center hover:bg-accent"><Plus className="size-4" /></button>
                </div>
                <Button variant="gold" size="lg" className="flex-1" disabled={!p.inStock} onClick={() => add(p, qty)}>Adicionar ao carrinho</Button>
              </>
            )}
            <Button variant="outline" size="lg" className="px-4" aria-pressed={fav} aria-label="Favoritar" onClick={() => toggleFav(p)}>
              <Heart className={fav ? "fill-gold text-gold" : ""} />
            </Button>
          </div>
        </div>
      </div>

      {!!related.length && (
        <section className="mt-20">
          <h2 className="text-3xl">Você também pode gostar</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {related.map((x) => <ProductCard key={x.id} p={x} />)}
          </div>
        </section>
      )}
    </div>
  );
}
