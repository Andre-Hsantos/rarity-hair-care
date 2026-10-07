import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Minus, Plus, Store, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { brl } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/site/PageHeader";
import { Button, buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho — Rarity Hair Care" },
      { name: "description", content: "Revise os itens do seu carrinho Rarity." },
      { property: "og:title", content: "Carrinho — Rarity Hair Care" },
      { property: "og:description", content: "Revise os itens do seu carrinho." },
    ],
  }),
  component: Cart,
});

function Cart() {
  const { cart, setQty, remove } = useStore();
  const [coupon, setCoupon] = useState("");
  const [discount, setDiscount] = useState(0);
  const [mode, setMode] = useState<"entrega" | "retirada">("entrega");
  const lines = cart;
  const subtotal = lines.reduce((s, l) => s + (l.p.price ?? 0) * l.qty, 0);
  const shipping = mode === "entrega" ? 15 : 0;
  const total = subtotal - discount + shipping;

  const apply = () => {
    if (coupon.trim().toUpperCase() === "RARITY10") {
      setDiscount(subtotal * 0.1);
      toast.success("Cupom aplicado: 10% de desconto");
    } else {
      setDiscount(0);
      toast.error("Cupom inválido. Experimente RARITY10 (demonstrativo).");
    }
  };

  return (
    <>
      <PageHeader title="Carrinho" crumb="Carrinho" />
      <div className="container-site mt-10">
        {!lines.length ? (
          <div className="rounded-xl border border-dashed p-14 text-center">
            <p className="font-display text-3xl">Seu carrinho está vazio</p>
            <Link to="/produtos" className={buttonVariants({ variant: "gold", size: "lg", className: "mt-6" })}>Ver produtos</Link>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
            <ul className="divide-y rounded-xl border bg-card">
              {lines.map(({ p, qty }) => (
                <li key={p.id} className="grid grid-cols-[80px_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-center sm:p-5">
                  <img src={p.image ?? undefined} alt={p.name} loading="lazy" className="aspect-square w-full rounded-lg bg-surface object-cover" />
                  <div className="min-w-0">
                    <Link to="/produto/$id" params={{ id: p.id }} className="font-display text-xl hover:text-gold-deep">{p.name}</Link>
                    <p className="text-sm text-muted-foreground">{p.size ? `${p.size} · ` : ""}{brl(p.price ?? 0)}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex h-9 items-center rounded-md border">
                        <button aria-label="Diminuir" disabled={qty <= 1} onClick={() => setQty(p.id, qty - 1)} className="grid h-full w-9 place-items-center hover:bg-accent disabled:opacity-40"><Minus className="size-3.5" /></button>
                        <span className="w-7 text-center text-sm">{qty}</span>
                        <button aria-label="Aumentar" onClick={() => setQty(p.id, qty + 1)} className="grid h-full w-9 place-items-center hover:bg-accent"><Plus className="size-3.5" /></button>
                      </div>
                      <button onClick={() => remove(p.id)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /> Remover</button>
                    </div>
                  </div>
                  <p className="col-start-2 font-medium sm:col-start-auto">{brl((p.price ?? 0) * qty)}</p>
                </li>
              ))}
            </ul>

            <aside className="h-fit space-y-6 rounded-xl border bg-card p-6 shadow-soft lg:sticky lg:top-44">
              <div>
                <p className="eyebrow text-muted-foreground">Como deseja receber?</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {([["entrega", Truck, "Entrega"], ["retirada", Store, "Retirada"]] as const).map(([k, I, l]) => (
                    <button key={k} onClick={() => setMode(k)} aria-pressed={mode === k} className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-sm transition ${mode === k ? "border-gold bg-gold/10" : "hover:bg-accent"}`}>
                      <I className="size-5" strokeWidth={1.5} /> {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="coupon" className="eyebrow text-muted-foreground">Cupom</label>
                <div className="mt-3 flex gap-2">
                  <input id="coupon" value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="Digite seu cupom" className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-gold" />
                  <Button variant="outline" onClick={apply} disabled={!coupon.trim()}>Aplicar</Button>
                </div>
              </div>
              <dl className="space-y-2 border-t pt-5 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{brl(subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">Desconto</dt><dd className="text-success">{discount ? `- ${brl(discount)}` : brl(0)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{mode === "entrega" ? "Entrega (estimativa)" : "Retirada"}</dt><dd>{shipping ? brl(shipping) : "Grátis"}</dd></div>
                <div className="flex justify-between border-t pt-3 text-lg font-medium"><dt>Total</dt><dd>{brl(total)}</dd></div>
              </dl>
              <Button variant="gold" size="lg" className="w-full" onClick={() => toast("Revisão do pedido disponível na próxima etapa do protótipo.")}>
                Continuar para revisão
              </Button>
              <Link to="/produtos" className="block text-center text-sm text-muted-foreground hover:text-foreground">Continuar comprando</Link>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
