import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { categories, products } from "@/lib/products";
import { ProductCard } from "@/components/site/ProductCard";
import { PageHeader } from "@/components/site/PageHeader";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

type S = { q?: string | undefined; categoria?: string | undefined; promo?: boolean | undefined };

export const Route = createFileRoute("/produtos")({
  validateSearch: (s: Record<string, unknown>): S => ({
    q: typeof s["q"] === "string" && s["q"] ? s["q"] : undefined,
    categoria: typeof s["categoria"] === "string" ? s["categoria"] : undefined,
    promo: s["promo"] === true || s["promo"] === "true" ? true : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Produtos — Rarity Hair Care" },
      { name: "description", content: "Catálogo Rarity: shampoos, condicionadores, máscaras, finalizadores, tratamentos e kits." },
      { property: "og:title", content: "Produtos — Rarity Hair Care" },
      { property: "og:description", content: "Explore o catálogo completo da Rarity." },
    ],
  }),
  component: Produtos,
});

const prices = [
  { id: "all", label: "Todos os preços", test: () => true },
  { id: "a", label: "Até R$ 80", test: (n: number) => n <= 80 },
  { id: "b", label: "R$ 80 a R$ 110", test: (n: number) => n > 80 && n <= 110 },
  { id: "c", label: "Acima de R$ 110", test: (n: number) => n > 110 },
];

function Produtos() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/produtos" });
  const [q, setQ] = useState(search.q ?? "");
  const [price, setPrice] = useState("all");
  const [onlyStock, setOnlyStock] = useState(false);
  const [sort, setSort] = useState("relevance");
  const cat = search.categoria;
  const promo = !!search.promo;

  const list = useMemo(() => {
    const pt = prices.find((p) => p.id === price)!.test;
    let r = products.filter(
      (p) =>
        (!cat || p.category === cat) &&
        (!promo || p.oldPrice) &&
        (!onlyStock || p.inStock) &&
        pt(p.price) &&
        (!q || p.name.toLowerCase().includes(q.toLowerCase())),
    );
    if (sort === "asc") r = [...r].sort((a, b) => a.price - b.price);
    if (sort === "desc") r = [...r].sort((a, b) => b.price - a.price);
    return r;
  }, [cat, promo, onlyStock, price, q, sort]);

  const setCat = (c?: string) => navigate({ search: (s) => ({ ...s, categoria: c }) });
  const clear = () => {
    setQ(""); setPrice("all"); setOnlyStock(false);
    navigate({ search: {} });
  };

  const filters = (
    <div className="space-y-8">
      <div>
        <p className="eyebrow text-muted-foreground">Categoria</p>
        <div className="mt-3 flex flex-col gap-1">
          {[undefined, ...categories].map((c) => (
            <button key={c ?? "all"} onClick={() => setCat(c)} className={`rounded-md px-3 py-2 text-left text-sm transition ${cat === c ? "bg-ink text-ink-foreground" : "hover:bg-accent"}`}>
              {c ?? "Todas"}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="eyebrow text-muted-foreground">Preço</p>
        <div className="mt-3 flex flex-col gap-2.5">
          {prices.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-2.5 text-sm">
              <input type="radio" name="price" checked={price === p.id} onChange={() => setPrice(p.id)} className="accent-[var(--gold-deep)]" />
              {p.label}
            </label>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <p className="eyebrow text-muted-foreground">Outros</p>
        <div className="flex items-center gap-2.5">
          <Checkbox id="stock" checked={onlyStock} onCheckedChange={(v) => setOnlyStock(!!v)} />
          <Label htmlFor="stock" className="font-normal">Somente disponíveis</Label>
        </div>
        <div className="flex items-center gap-2.5">
          <Checkbox id="promo" checked={promo} onCheckedChange={(v) => navigate({ search: (s) => ({ ...s, promo: v ? true : undefined }) })} />
          <Label htmlFor="promo" className="font-normal">Em promoção</Label>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <PageHeader title={cat ?? "Produtos"} crumb="Produtos" subtitle="Encontre o cuidado ideal para o seu cabelo." />
      <div className="container-site mt-10 grid gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">{filters}</aside>
        <div className="min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar no catálogo" aria-label="Buscar no catálogo" className="h-11 w-full rounded-md border border-input bg-card pl-10 pr-4 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/25" />
            </div>
            <div className="flex gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="h-11 flex-1 lg:hidden"><SlidersHorizontal /> Filtros</Button>
                </SheetTrigger>
                <SheetContent side="left" className="overflow-y-auto bg-background">
                  <SheetTitle className="font-display text-2xl">Filtros</SheetTitle>
                  <div className="mt-6">{filters}</div>
                </SheetContent>
              </Sheet>
              <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Ordenar" className="h-11 flex-1 rounded-md border border-input bg-card px-3 text-sm outline-none focus:border-gold">
                <option value="relevance">Mais relevantes</option>
                <option value="asc">Menor preço</option>
                <option value="desc">Maior preço</option>
              </select>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{list.length} {list.length === 1 ? "produto" : "produtos"}</span>
            {(cat || promo || q || onlyStock || price !== "all") && (
              <button onClick={clear} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs hover:bg-accent">
                <X className="size-3" /> Limpar filtros
              </button>
            )}
          </div>
          {list.length ? (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-6 xl:grid-cols-3">
              {list.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed p-12 text-center">
              <p className="font-display text-2xl">Nenhum produto encontrado</p>
              <p className="mt-2 text-sm text-muted-foreground">Tente ajustar a busca ou os filtros.</p>
              <Button variant="dark" className="mt-6" onClick={clear}>Limpar filtros</Button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
