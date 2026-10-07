import { brl } from "@/lib/catalog";
import { formatAddress, orderNumber, statusLabel } from "@/lib/orders";
import type { FullOrder } from "@/lib/orderQueries";

const dt = (s: string) => new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });

export function StatusBadge({ status }: { status: string }) {
  const tone = status === "cancelado" ? "bg-destructive/10 text-destructive" : status === "concluido" ? "bg-success/10 text-success" : "bg-gold/15 text-gold-deep";
  return <span className={`rounded-full px-3 py-1 text-xs font-medium ${tone}`}>{statusLabel[status] ?? status}</span>;
}

export function OrderDetail({ o, showHistory = true }: { o: FullOrder; showHistory?: boolean }) {
  const cancel = o.status === "cancelado" ? [...o.history].reverse().find((h) => h.new_status === "cancelado")?.change_note : null;
  return (
    <div className="space-y-5 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-display text-2xl">Pedido {orderNumber(o.id)}</p><p className="text-muted-foreground">{dt(o.created_at)}</p></div>
        <StatusBadge status={o.status} />
      </div>
      {cancel && <p className="rounded-md bg-destructive/5 p-3 text-destructive">Motivo do cancelamento: {cancel}</p>}
      <ul className="divide-y rounded-lg border">
        {o.items.map((i) => (
          <li key={i.id} className="flex flex-wrap justify-between gap-2 p-3">
            <span><span className="font-medium">{i.product_name}</span><span className="block text-muted-foreground">{i.quantity} × {brl(Number(i.unit_price))}{Number(i.discount) > 0 ? ` · desconto ${brl(Number(i.discount))}` : ""}</span></span>
            <span className="font-medium">{brl(Number(i.item_total))}</span>
          </li>
        ))}
      </ul>
      <dl className="space-y-1.5">
        <div className="flex justify-between"><dt className="text-muted-foreground">Subtotal</dt><dd>{brl(Number(o.products_total))}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">Desconto{o.coupon ? ` (cupom ${o.coupon})` : ""}</dt><dd>{Number(o.discount) ? `- ${brl(Number(o.discount))}` : brl(0)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted-foreground">{o.delivery === "entrega" ? "Entrega" : "Retirada na loja"}</dt><dd>{o.delivery === "retirada" ? brl(0) : o.shipping == null ? "A combinar" : brl(Number(o.shipping))}</dd></div>
        <div className="flex justify-between border-t pt-2 text-base font-medium"><dt>Total</dt><dd>{brl(Number(o.total))}{o.delivery === "entrega" && o.shipping == null ? " + entrega" : ""}</dd></div>
      </dl>
      {o.delivery === "entrega" && o.address && <p><span className="text-muted-foreground">Endereço: </span>{formatAddress(o.address)}</p>}
      {o.note && <p><span className="text-muted-foreground">Observação: </span>{o.note}</p>}
      {showHistory && (
        <div>
          <p className="eyebrow text-muted-foreground">Histórico</p>
          <ol className="mt-2 space-y-2 border-l pl-4">
            {o.history.map((h) => (
              <li key={h.id}>
                <p className="font-medium">{h.old_status && h.old_status !== h.new_status ? `${statusLabel[h.old_status] ?? h.old_status} → ` : ""}{statusLabel[h.new_status ?? ""] ?? h.new_status}</p>
                <p className="text-xs text-muted-foreground">{dt(h.created_at)}{h.change_note ? ` · ${h.change_note}` : ""}</p>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
