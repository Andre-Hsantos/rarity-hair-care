import { Link } from "@tanstack/react-router";
import { Heart, ShoppingBag } from "lucide-react";
import { brl, type Product } from "@/lib/products";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";

export function ProductCard({ p }: { p: Product }) {
  const { add, toggleFav, favorites } = useStore();
  const fav = favorites.includes(p.id);
  const off = p.oldPrice ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-card">
      <div className="relative aspect-square overflow-hidden bg-surface">
        <Link to="/produto/$id" params={{ id: p.id }} aria-label={p.name}>
          <img src={p.image} alt={p.name} loading="lazy" width={816} height={816} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
        </Link>
        {off > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium tracking-wide text-gold">-{off}%</span>
        )}
        {!p.inStock && (
          <span className="absolute left-3 top-3 rounded-full bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">Indisponível</span>
        )}
        <button
          onClick={() => toggleFav(p)}
          aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          aria-pressed={fav}
          className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-card/90 shadow-soft transition hover:scale-105"
        >
          <Heart className={`size-4 ${fav ? "fill-gold text-gold" : "text-foreground/70"}`} />
        </button>
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <p className="eyebrow text-muted-foreground">{p.category}</p>
        <Link to="/produto/$id" params={{ id: p.id }} className="mt-1.5 font-display text-xl leading-tight hover:text-gold-deep">{p.name}</Link>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.short}</p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="min-w-0">
            {p.oldPrice && <p className="text-xs text-muted-foreground line-through">{brl(p.oldPrice)}</p>}
            <p className="text-lg font-medium">{brl(p.price)}</p>
          </div>
          <Button variant="dark" size="icon" disabled={!p.inStock} onClick={() => add(p)} aria-label={`Adicionar ${p.name} ao carrinho`} className="shrink-0 rounded-full">
            <ShoppingBag />
          </Button>
        </div>
      </div>
    </article>
  );
}
