import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/catalog";
import { useAuth } from "@/lib/auth";
import { useQuote } from "@/lib/useQuote";
import { buildWhatsappMessage, whatsappLink, type AddressSnap } from "@/lib/orders";
import { fetchOrder } from "@/lib/orderQueries";
import { PageHeader } from "@/components/site/PageHeader";
import { Button, buttonVariants } from "@/components/ui/button";

type Search = { modo: "entrega" | "retirada"; cupom?: string | undefined };

export const Route = createFileRoute("/_authenticated/checkout")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    modo: s['modo'] === "entrega" ? "entrega" : "retirada",
    cupom: typeof s['cupom'] === "string" && s['cupom'] ? s['cupom'] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Revisão do pedido — Rarity Hair Care" },
      { name: "description", content: "Revise seu pedido antes de finalizar pelo WhatsApp." },
      { property: "og:title", content: "Revisão do pedido — Rarity Hair Care" },
      { property: "og:description", content: "Revise seu pedido Rarity." },
    ],
  }),
  component: Checkout,
});

const inp = "h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:border-gold";
const empty: AddressSnap = { street: "", number: "", complement: "", district: "", city: "", state: "", zip: "" };

function Checkout() {
  const { modo, cupom = "" } = Route.useSearch();
  const { session, profile } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const quote = useQuote(cupom, modo);
  const q = quote.data;
  const [addr, setAddr] = useState<AddressSnap>(empty);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const requestId = useRef(crypto.randomUUID());

  const saved = useQuery({
    queryKey: ["my-address", session?.user.id],
    enabled: modo === "entrega",
    queryFn: async () => {
      const { data } = await supabase.from("addresses").select("*").order("is_default", { ascending: false }).order("updated_at", { ascending: false }).limit(1).maybeSingle();
      return data;
    },
  });
  useEffect(() => {
    const a = saved.data;
    if (a) setAddr({ street: a.street, number: a.number ?? "", complement: a.complement ?? "", district: a.district ?? "", city: a.city, state: a.state, zip: a.zip ?? "" });
  }, [saved.data]);

  const finish = async () => {
    if (busy) return;
    if (modo === "entrega" && (!addr.street.trim() || !addr.city.trim() || !addr.state.trim())) { toast.error("Informe rua, cidade e estado para a entrega."); return; }
    setBusy(true);
    const win = window.open("", "_blank"); // opened during the click so browsers don't block it
    if (win) win.opener = null; // detach the new tab from the store page
    const { data: id, error } = await supabase.rpc("create_order", {
      _coupon: cupom, _delivery: modo, _address: modo === "entrega" ? addr : null, _note: note, _request_id: requestId.current,
    } as never);
    if (error || id == null) {
      win?.close();
      setBusy(false);
      toast.error(error?.message ?? "Não foi possível criar o pedido.");
      qc.invalidateQueries({ queryKey: ["quote"] });
      return;
    }
    const orderId = Number(id);
    qc.invalidateQueries({ queryKey: ["cart"] });
    qc.invalidateQueries({ queryKey: ["my-orders"] });
    try {
      const o = await fetchOrder(orderId);
      const url = whatsappLink(buildWhatsappMessage({ ...o, customerName: profile?.name || "Cliente" }));
      if (win) win.location.href = url;
    } catch { win?.close(); }
    navigate({ to: "/pedido/$id", params: { id: String(orderId) }, replace: true });
  };

  return (
    <>
      <PageHeader title="Revisão do pedido" crumb="Revisão" />
      <div className="container-site mt-10">
        {quote.isLoading ? <p className="text-muted-foreground">Carregando…</p> : !q || q.empty ? (
          <div className="rounded-xl border border-dashed p-14 text-center">
            <p className="font-display text-3xl">Seu carrinho está vazio</p>
            <Link to="/produtos" className={buttonVariants({ variant: "gold", size: "lg", className: "mt-6" })}>Ver produtos</Link>
          </div>
        ) : (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-6">
              <ul className="divide-y rounded-xl border bg-card">
                {q.items.map((i) => (
                  <li key={i.product_id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">{i.name}{i.size_label ? ` — ${i.size_label}` : ""}</p>
                      <p className="text-muted-foreground">{i.quantity} × {i.in_promotion && Number(i.original_price) > Number(i.unit_price) && <s className="mr-1">{brl(Number(i.original_price))}</s>}{brl(Number(i.unit_price))}{i.in_promotion && <span className="ml-1.5 text-gold-deep">Promoção</span>}</p>
                      {i.issue && <p className="text-destructive">{i.issue}</p>}
                      {!i.issue && i.qty_discount_applied && <p className="text-xs text-gold-deep">Desconto por quantidade: {Number(i.qty_percent)}% (a partir de {i.qty_min} un.)</p>}
                      {Number(i.coupon_discount) > 0 && <p className="text-success">Cupom: - {brl(Number(i.coupon_discount))}</p>}
                      {!i.issue && i.coupon_note && <p className="text-xs text-muted-foreground">{i.coupon_note}</p>}
                    </div>
                    <p className="font-medium">{brl(Number(i.line_total) - Number(i.coupon_discount))}</p>
                  </li>
                ))}
              </ul>
              {modo === "entrega" && (
                <div className="rounded-xl border bg-card p-6">
                  <h2 className="text-2xl">Endereço de entrega</h2>
                  <div className="mt-4 grid gap-3 sm:grid-cols-6">
                    <input className={`${inp} sm:col-span-4`} placeholder="Rua *" value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} />
                    <input className={`${inp} sm:col-span-2`} placeholder="Número" value={addr.number} onChange={(e) => setAddr({ ...addr, number: e.target.value })} />
                    <input className={`${inp} sm:col-span-3`} placeholder="Complemento" value={addr.complement} onChange={(e) => setAddr({ ...addr, complement: e.target.value })} />
                    <input className={`${inp} sm:col-span-3`} placeholder="Bairro" value={addr.district} onChange={(e) => setAddr({ ...addr, district: e.target.value })} />
                    <input className={`${inp} sm:col-span-3`} placeholder="Cidade *" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
                    <input className={`${inp} sm:col-span-1`} placeholder="UF *" maxLength={2} value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value.toUpperCase() })} />
                    <input className={`${inp} sm:col-span-2`} placeholder="CEP" inputMode="numeric" maxLength={9} value={addr.zip} onChange={async (e) => {
                      const zip = e.target.value;
                      setAddr((a) => ({ ...a, zip }));
                      const d = zip.replace(/\D/g, "");
                      if (d.length !== 8) return;
                      try {
                        const r = await fetch(`https://viacep.com.br/ws/${d}/json/`).then((x) => x.json());
                        if (r.erro) { toast.error("CEP não encontrado."); return; }
                        setAddr((a) => ({ ...a, street: r.logradouro || a.street, district: r.bairro || a.district, city: r.localidade || a.city, state: r.uf || a.state }));
                      } catch { /* sem conexão: preenchimento manual */ }
                    }} />
                  </div>
                </div>
              )}
              <div className="rounded-xl border bg-card p-6">
                <label htmlFor="note" className="text-2xl font-display">Observação (opcional)</label>
                <textarea id="note" maxLength={500} value={note} onChange={(e) => setNote(e.target.value)} className="mt-3 min-h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-gold" />
              </div>
            </div>
            <aside className="h-fit space-y-5 rounded-xl border bg-card p-6 shadow-soft lg:sticky lg:top-44">
              <dl className="space-y-2 text-sm">
                {(() => {
                  const qd = q.items.reduce((s, i) => s + (i.qty_discount_applied && !i.issue ? Math.max(0, Number(i.list_price) - Number(i.original_price)) * i.quantity : 0), 0);
                  return (
                    <>
                      <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{brl(Number(q.products_total) + qd)}</dd></div>
                      {qd > 0 && <div className="flex justify-between"><dt className="text-muted-foreground">Desconto por quantidade</dt><dd className="text-success">- {brl(qd)}</dd></div>}
                      <div className="flex justify-between"><dt className="text-muted-foreground">Cupom</dt><dd>{q.coupon?.code ?? "—"}</dd></div>
                      <div className="flex justify-between"><dt className="text-muted-foreground">{qd > 0 ? "Desconto do cupom" : "Desconto"}</dt><dd className="text-success">{Number(q.discount) ? `- ${brl(Number(q.discount))}` : brl(0)}</dd></div>
                    </>
                  );
                })()}
                <div className="flex justify-between"><dt className="text-muted-foreground">{modo === "entrega" ? "Entrega" : "Retirada na loja"}</dt><dd>{modo === "entrega" ? "A combinar" : brl(0)}</dd></div>
                <div className="flex justify-between border-t pt-3 text-lg font-medium"><dt>Total</dt><dd>{brl(Number(q.total))}</dd></div>
                {modo === "entrega" && <p className="text-xs text-muted-foreground">Entrega a combinar com a loja.</p>}
              </dl>
              {q.has_issues && <p className="text-sm text-destructive">Há itens indisponíveis. <Link to="/carrinho" className="underline">Voltar ao carrinho</Link>.</p>}
              {cupom && q.coupon_error && <p className="text-sm text-destructive">{q.coupon_error} <Link to="/carrinho" className="underline">Alterar cupom</Link>.</p>}
              <Button variant="gold" size="lg" className="w-full" disabled={busy || q.has_issues || (!!cupom && !!q.coupon_error)} onClick={finish}>
                {busy ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />} Finalizar pelo WhatsApp
              </Button>
              <Link to="/carrinho" className="block text-center text-sm text-muted-foreground hover:text-foreground">Voltar ao carrinho</Link>
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
