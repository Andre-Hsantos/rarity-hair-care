import { Link } from "@tanstack/react-router";
import { Heart, ImageOff, MessageCircle, ShoppingBag } from "lucide-react";
import { brl, strikePrice, type Product } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { Button, buttonVariants } from "@/components/ui/button";

export function ProductCard({ p }: { p: Product }) {
  const { add, toggleFav, favorites } = useStore();
  const fav = favorites.includes(p.id);
  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border bg-card shadow-soft transition duration-300 hover:-translate-y-0.5 hover:shadow-card">
      <div className="relative aspect-square overflow-hidden bg-surface">
        <Link to="/produto/$id" params={{ id: p.id }} aria-label={p.name}>
          {p.image ? (
            <img src={p.image} alt={p.name} loading="lazy" width={816} height={816} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]" />
          ) : (
            <span className="grid h-full w-full place-items-center text-muted-foreground"><ImageOff className="size-8" strokeWidth={1.25} /></span>
          )}
        </Link>
        <div className="absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {p.inPromotion && <span className="rounded-full bg-gold px-2.5 py-1 text-[11px] font-medium tracking-wide text-ink">Promoção</span>}
          {p.isKit && <span className="rounded-full bg-ink px-2.5 py-1 text-[11px] font-medium tracking-wide text-gold">Kit</span>}
          {p.proOnly && <span className="rounded-full bg-card px-2.5 py-1 text-[11px] font-medium text-gold-deep">Profissional</span>}
          {!p.inStock && <span className="rounded-full bg-card px-2.5 py-1 text-[11px] font-medium text-muted-foreground">Indisponível</span>}
        </div>
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
        <p className="eyebrow text-muted-foreground">{p.category ?? (p.isKit ? "Kit" : "Rarity")}</p>
        <Link to="/produto/$id" params={{ id: p.id }} className="mt-1.5 font-display text-xl leading-tight hover:text-gold-deep">{p.name}</Link>
        {p.size && <p className="mt-1 text-sm text-muted-foreground">{p.size}</p>}
        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="min-w-0">
            {p.price == null ? <p className="text-base font-medium">Sob consulta</p> : <>{strikePrice(p) != null && <p className="text-xs text-muted-foreground">De <s>{brl(strikePrice(p)!)}</s></p>}<p className="text-lg font-medium">{strikePrice(p) != null && <span className="text-sm font-normal text-gold-deep">Por </span>}{brl(p.price)}</p></>}
          </div>
          {p.price == null ? (
            <Link to="/contato" aria-label={`Consultar ${p.name}`} className={buttonVariants({ variant: "dark", size: "icon", className: "shrink-0 rounded-full" })}>
              <MessageCircle />
            </Link>
          ) : (
            <Button variant="dark" size="icon" disabled={!p.inStock} onClick={() => add(p)} aria-label={`Adicionar ${p.name} ao carrinho`} className="shrink-0 rounded-full">
              <ShoppingBag />
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
