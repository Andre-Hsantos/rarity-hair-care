import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, Minus, Plus, Store, Trash2, Truck } from "lucide-react";
import { brl } from "@/lib/catalog";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useQuote } from "@/lib/useQuote";
import { pctLabel } from "@/lib/quantityDiscounts";
import { PageHeader } from "@/components/site/PageHeader";
import { Button, buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/carrinho")({
  head: () => ({
    meta: [
      { title: "Carrinho — Rarity Hair Care" },
      { name: "description", content: "Revise os itens do seu carrinho Rarity." },
      { property: "og:title", content: "Carrinho — Rarity Hair Care" },
      { property: "og:description", content: "Revise os itens do seu carrinho." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Cart,
});

function Cart() {
  const { cart, setQty, remove, ready } = useStore();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [input, setInput] = useState("");
  const [coupon, setCoupon] = useState("");
  const [mode, setMode] = useState<"entrega" | "retirada">("retirada");
  const quote = useQuote(coupon, mode);
  const q = quote.data;
  const qtyOf = new Map(cart.map((l) => [l.id, l.qty]));
  // Ignore quote lines computed for an older quantity (still saving); they refresh right after.
  const issues = new Map((q?.items ?? []).filter((i) => qtyOf.get(i.product_id) === i.quantity).map((i) => [i.product_id, i]));
  const qtyDiscount = (q?.items ?? []).reduce((s, i) => s + (i.qty_discount_applied && !i.issue ? Math.max(0, Number(i.list_price) - Number(i.original_price)) * i.quantity : 0), 0);
  const localSubtotal = cart.reduce((s, l) => s + (l.p?.price ?? 0) * l.qty, 0);
  const subtotal = q ? Number(q.products_total) + qtyDiscount : localSubtotal;
  const discount = q ? Number(q.discount) : 0;
  const total = subtotal - qtyDiscount - discount;

  if (!ready) return <><PageHeader title="Carrinho" crumb="Carrinho" /><p className="container-site mt-10 text-muted-foreground">Carregando…</p></>;

  return (
    <>
      <PageHeader title="Carrinho" crumb="Carrinho" />
      <div className="container-site mt-10">
        {!cart.length ? (
          <div className="rounded-xl border border-dashed p-14 text-center">
            <p className="font-display text-3xl">Seu carrinho está vazio</p>
            <Link to="/produtos" className={buttonVariants({ variant: "gold", size: "lg", className: "mt-6" })}>Ver produtos</Link>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
            <ul className="h-fit divide-y rounded-xl border bg-card">
              {cart.map(({ id, p, qty }) => {
                const info = issues.get(id);
                const issue = info?.issue ?? (!p ? "Produto indisponível no momento." : p.price == null ? "Produto exclusivo para profissionais aprovados." : !p.inStock ? "Produto esgotado." : null);
                const unit = info ? Number(info.unit_price) : p?.price ?? 0;
                return (
                  <li key={id} className="grid grid-cols-[80px_minmax(0,1fr)] gap-4 p-4 sm:grid-cols-[96px_minmax(0,1fr)_auto] sm:items-center sm:p-5">
                    <img src={p?.image ?? info?.image_url ?? undefined} alt={p?.name ?? ""} loading="lazy" className="aspect-square w-full rounded-lg bg-surface object-cover" />
                    <div className="min-w-0">
                      {p ? <Link to="/produto/$id" params={{ id }} className="font-display text-xl hover:text-gold-deep">{p.name}</Link> : <p className="font-display text-xl">{info?.name ?? "Produto indisponível"}</p>}
                      <p className="text-sm text-muted-foreground">{p?.size ? `${p.size} · ` : ""}{(() => { const ref = info?.qty_discount_applied ? Number(info.list_price) : info?.in_promotion ? Number(info.original_price) : !info && p?.inPromotion ? p.originalPrice ?? 0 : 0; return ref > unit ? <s className="mr-1">{brl(ref)}</s> : null; })()}{brl(unit)}{(info ? info.in_promotion : p?.inPromotion) && <span className="ml-1.5 text-gold-deep">Promoção</span>}</p>
                      {!issue && info?.qty_discount_applied && <p className="mt-1 text-xs text-gold-deep">Desconto por quantidade: {pctLabel(Number(info.qty_percent))} (a partir de {info.qty_min} un.)</p>}
                      {issue && <p className="mt-1 flex items-center gap-1.5 text-sm text-destructive"><AlertTriangle className="size-3.5" /> {issue}</p>}
                      {!issue && info?.coupon_note && <p className="mt-1 text-xs text-muted-foreground">{info.coupon_note}</p>}
                      <div className="mt-3 flex items-center gap-3">
                        <div className="flex h-9 items-center rounded-md border">
                          <button aria-label="Diminuir" disabled={qty <= 1} onClick={() => setQty(id, qty - 1)} className="grid h-full w-9 place-items-center hover:bg-accent disabled:opacity-40"><Minus className="size-3.5" /></button>
                          <span className="w-7 text-center text-sm">{qty}</span>
                          <button aria-label="Aumentar" disabled={qty >= 99} onClick={() => setQty(id, qty + 1)} className="grid h-full w-9 place-items-center hover:bg-accent disabled:opacity-40"><Plus className="size-3.5" /></button>
                        </div>
                        <button onClick={() => remove(id)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /> Remover</button>
                      </div>
                    </div>
                    <p className="col-start-2 font-medium sm:col-start-auto">{brl(unit * qty)}</p>
                  </li>
                );
              })}
            </ul>

            <aside className="h-fit space-y-6 rounded-xl border bg-card p-6 shadow-soft lg:sticky lg:top-44">
              <div>
                <p className="eyebrow text-muted-foreground">Como deseja receber?</p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {([["retirada", Store, "Retirada na loja"], ["entrega", Truck, "Entrega a combinar"]] as const).map(([k, I, l]) => (
                    <button key={k} onClick={() => setMode(k)} aria-pressed={mode === k} className={`flex flex-col items-center gap-1.5 rounded-lg border p-3 text-center text-sm transition ${mode === k ? "border-gold bg-gold/10" : "hover:bg-accent"}`}>
                      <I className="size-5" strokeWidth={1.5} /> {l}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="coupon" className="eyebrow text-muted-foreground">Cupom</label>
                {session ? (
                  <>
                    <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); setCoupon(input.trim()); }}>
                      <input id="coupon" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Digite seu cupom" className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm uppercase outline-none focus:border-gold" />
                      {coupon ? <Button type="button" variant="outline" onClick={() => { setCoupon(""); setInput(""); }}>Remover</Button> : <Button variant="outline" disabled={!input.trim()}>Aplicar</Button>}
                    </form>
                    {coupon && q?.coupon_error && <p className="mt-2 text-sm text-destructive">{q.coupon_error}</p>}
                    {coupon && q?.coupon && <p className="mt-2 text-sm text-success">Cupom {q.coupon.code} aplicado.</p>}
                    <p className="mt-2 text-xs text-muted-foreground">Um cupom por pedido. Não vale para produtos em promoção.</p>
                  </>
                ) : <p className="mt-3 text-sm text-muted-foreground"><Link to="/login" className="text-gold-deep underline">Entre na sua conta</Link> para aplicar cupons e finalizar.</p>}
              </div>
              <dl className="space-y-2 border-t pt-5 text-sm">
                <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{brl(subtotal)}</dd></div>
                {qtyDiscount > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Desconto por quantidade</dt><dd className="text-success">- {brl(qtyDiscount)}</dd></div>}
                <div className="flex justify-between"><dt className="text-muted-foreground">{qtyDiscount > 0 ? "Desconto do cupom" : "Desconto"}</dt><dd className="text-success">{discount ? `- ${brl(discount)}` : brl(0)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted-foreground">{mode === "entrega" ? "Entrega" : "Retirada na loja"}</dt><dd>{mode === "entrega" ? "A combinar" : brl(0)}</dd></div>
                <div className="flex justify-between border-t pt-3 text-lg font-medium"><dt>Total</dt><dd>{brl(total)}</dd></div>
                {mode === "entrega" && <p className="text-xs text-muted-foreground">O valor da entrega é combinado com a loja pelo WhatsApp.</p>}
              </dl>
              {q?.has_issues && <p className="rounded-md bg-destructive/5 p-3 text-sm text-destructive">Remova ou ajuste os itens indisponíveis para continuar.</p>}
              <Button
                variant="gold" size="lg" className="w-full"
                disabled={!!session && (quote.isLoading || !!q?.has_issues || (!!coupon && !!q?.coupon_error))}
                onClick={() => session ? navigate({ to: "/checkout", search: { modo: mode, cupom: coupon || undefined } }) : navigate({ to: "/login" })}
              >
                {session ? "Continuar para revisão" : "Entrar para finalizar"}
              </Button>
              <Link to="/produtos" className="block text-center text-sm text-muted-foreground hover:text-foreground">Continuar comprando</Link>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
