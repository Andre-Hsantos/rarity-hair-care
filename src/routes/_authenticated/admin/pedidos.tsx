import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DeleteConfirm } from "@/components/admin/DeleteConfirm";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { brl } from "@/lib/catalog";
import { fetchOrder, type FullOrder } from "@/lib/orderQueries";
import { isFinished, ORDER_STATUSES, orderNumber, statusLabel } from "@/lib/orders";
import { OrderDetail, StatusBadge } from "@/components/site/OrderDetail";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { areaCls, Empty, ErrorBox, FieldRow, inputCls, Loading, PageHead } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/pedidos")({ component: Orders });

function Orders() {
  const list = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("id, created_at, status, total, delivery_method, shipping, tecnobyte_registered, profiles(name, email, phone)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [tab, setTab] = useState<"ativos" | "finalizados">("ativos");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<number | null>(null);
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/^#/, "");
    return (list.data ?? []).filter((o) => (tab === "finalizados") === isFinished(o.status)).filter((o) => {
      const p = o.profiles as { name: string; email: string; phone: string | null } | null;
      return !s || String(o.id) === s || p?.name.toLowerCase().includes(s) || p?.email.toLowerCase().includes(s) || (p?.phone ?? "").replace(/\D/g, "").includes(s.replace(/\D/g, "") || "§");
    });
  }, [list.data, tab, q]);
  const counts = { ativos: (list.data ?? []).filter((o) => !isFinished(o.status)).length, finalizados: (list.data ?? []).filter((o) => isFinished(o.status)).length };

  return (
    <div>
      <PageHead title="Pedidos" description="Pedidos criados pela loja. Toda alteração fica registrada no histórico." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex rounded-md border p-1">
          {(["ativos", "finalizados"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`rounded px-3 py-1.5 text-sm ${tab === t ? "bg-ink text-ink-foreground" : "hover:bg-accent"}`}>
              {t === "ativos" ? "Em andamento" : "Finalizados"} ({counts[t]})
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input className={`${inputCls} pl-9`} placeholder="Nº do pedido, cliente, e-mail ou telefone" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      </div>
      {list.isLoading ? <Loading /> : list.isError ? <ErrorBox /> : !rows.length ? <Empty>{list.data?.length ? "Nenhum pedido encontrado." : "Nenhum pedido ainda."}</Empty> : (
        <div className="divide-y rounded-lg border">
          {rows.map((o) => {
            const p = o.profiles as { name: string; email: string } | null;
            return (
              <button key={o.id} onClick={() => setOpen(o.id)} className="flex w-full flex-wrap items-center gap-3 p-4 text-left text-sm hover:bg-accent/50">
                <span className="w-16 font-medium">{orderNumber(o.id)}</span>
                <span className="min-w-0 flex-1"><span className="block font-medium">{p?.name || "—"}</span><span className="text-muted-foreground">{new Date(o.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })} · {o.delivery_method === "entrega" ? "Entrega" : "Retirada"}{o.tecnobyte_registered ? " · Tecnobyte ✓" : ""}</span></span>
                <StatusBadge status={o.status} />
                <span className="w-28 text-right font-medium">{brl(Number(o.total))}</span>
              </button>
            );
          })}
        </div>
      )}
      <Dialog open={open != null} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-h-[96vh] w-[96vw] max-w-[96vw] overflow-y-auto p-5 sm:p-6 lg:max-w-6xl">
          <DialogHeader><DialogTitle>Detalhes do pedido</DialogTitle></DialogHeader>
          {open != null && <AdminOrder id={open} onDeleted={() => setOpen(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function AdminOrder({ id, onDeleted }: { id: number; onDeleted: () => void }) {
  const qc = useQueryClient();
  const q = useQuery({ queryKey: ["admin-order", id], queryFn: () => fetchOrder(id) });
  const client = useQuery({
    queryKey: ["admin-order-client", id, q.data?.user_id],
    enabled: !!q.data,
    queryFn: async () => (await supabase.from("profiles").select("name, email, phone, account_type").eq("id", q.data!.user_id).maybeSingle()).data,
  });
  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_delete_order", { _order_id: id });
      if (error) throw new Error(error.message || "Não foi possível excluir o pedido.");
    },
    onSuccess: () => { toast.success(`Pedido ${orderNumber(id)} excluído definitivamente.`); onDeleted(); qc.removeQueries({ queryKey: ["admin-order", id] }); qc.invalidateQueries(); },
    onError: (e) => toast.error((e as Error).message),
  });
  if (q.isLoading) return <Loading />;
  if (!q.data) return <ErrorBox message="Pedido não encontrado." />;
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-order", id] }); qc.invalidateQueries({ queryKey: ["admin-orders"] }); };
  const c = client.data;
  return (
    <div className="space-y-6">
      {c && <p className="text-sm"><span className="font-medium">{c.name}</span> · {c.email} · {c.phone || "sem telefone"} · {c.account_type === "profissional" ? "Profissional" : "Comum"}</p>}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <OrderDetail o={q.data} />
        <div className="space-y-6">
          <EditOrder o={q.data} onDone={refresh} />
          <EditItems o={q.data} onDone={refresh} />
        </div>
      </div>
      <div className="border-t pt-4">
        <DeleteConfirm label="Excluir pedido" title={`Excluir pedido ${orderNumber(id)}`} pending={del.isPending} onConfirm={() => del.mutate()}
          items={["O pedido e todos os seus itens", "Todo o histórico de alterações do pedido", "O cliente e os produtos NÃO são excluídos"]} />
      </div>
    </div>
  );
}

function EditOrder({ o, onDone }: { o: FullOrder; onDone: () => void }) {
  const [status, setStatus] = useState<string>(o.status);
  const [shipping, setShipping] = useState(o.shipping == null ? "" : String(o.shipping));
  const [tec, setTec] = useState(o.tecnobyte_registered);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const save = async () => {
    const sh = shipping.trim() === "" ? null : Number(shipping.replace(",", "."));
    if (sh != null && (Number.isNaN(sh) || sh < 0)) { toast.error("Frete inválido."); return; }
    setBusy(true);
    const { error } = await supabase.rpc("admin_update_order", { _order_id: o.id, _status: status, _shipping: sh as number, _tecnobyte: tec, _note: note });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Pedido atualizado"); setNote(""); onDone();
  };
  return (
    <div className="space-y-3 rounded-lg border p-4">
      <p className="font-medium">Atualizar pedido</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <FieldRow label="Status"><select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>{ORDER_STATUSES.map((s) => <option key={s} value={s}>{statusLabel[s]}</option>)}</select></FieldRow>
        <FieldRow label="Frete (R$)" hint={o.delivery_method === "entrega" ? "Vazio = a combinar" : "Retirada: R$ 0,00"}><input className={inputCls} inputMode="decimal" value={shipping} onChange={(e) => setShipping(e.target.value)} placeholder="A combinar" /></FieldRow>
        <FieldRow label="Venda registrada no Tecnobyte"><select className={inputCls} value={tec ? "s" : "n"} onChange={(e) => setTec(e.target.value === "s")}><option value="n">Não</option><option value="s">Sim</option></select></FieldRow>
      </div>
      <FieldRow label="Observação / motivo" hint="Obrigatório ao alterar frete ou cancelar."><textarea className={areaCls} value={note} onChange={(e) => setNote(e.target.value)} /></FieldRow>
      <Button variant="dark" disabled={busy} onClick={save}>Salvar</Button>
    </div>
  );
}

function EditItems({ o, onDone }: { o: FullOrder; onDone: () => void }) {
  const [edit, setEdit] = useState<{ id: number; qty: string; price: string; disc: string; note: string } | null>(null);
  const save = async () => {
    if (!edit) return;
    const { error } = await supabase.rpc("admin_update_order_item", {
      _item_id: edit.id, _quantity: Number(edit.qty), _unit_price: Number(edit.price.replace(",", ".")), _discount: Number(edit.disc.replace(",", ".")), _note: edit.note,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Item atualizado"); setEdit(null); onDone();
  };
  return (
    <div className="space-y-2 rounded-lg border p-4">
      <p className="font-medium">Ajustar itens</p>
      {o.items.map((i) => edit?.id === i.id ? (
        <div key={i.id} className="space-y-2 rounded-md bg-surface p-3">
          <p className="text-sm font-medium">{i.product_name}</p>
          <div className="grid grid-cols-3 gap-2">
            <FieldRow label="Qtd"><input className={inputCls} inputMode="numeric" value={edit.qty} onChange={(e) => setEdit({ ...edit, qty: e.target.value })} /></FieldRow>
            <FieldRow label="Preço unit."><input className={inputCls} inputMode="decimal" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} /></FieldRow>
            <FieldRow label="Desconto"><input className={inputCls} inputMode="decimal" value={edit.disc} onChange={(e) => setEdit({ ...edit, disc: e.target.value })} /></FieldRow>
          </div>
          <FieldRow label="Motivo (obrigatório)"><input className={inputCls} value={edit.note} onChange={(e) => setEdit({ ...edit, note: e.target.value })} /></FieldRow>
          <div className="flex gap-2"><Button size="sm" variant="dark" onClick={save}>Salvar item</Button><Button size="sm" variant="outline" onClick={() => setEdit(null)}>Cancelar</Button></div>
        </div>
      ) : (
        <div key={i.id} className="flex items-center justify-between text-sm">
          <span>{i.product_name} · {i.quantity} × {brl(Number(i.unit_price))}</span>
          <Button size="sm" variant="outline" onClick={() => setEdit({ id: i.id, qty: String(i.quantity), price: String(i.unit_price), disc: String(i.discount), note: "" })}>Editar</Button>
        </div>
      ))}
    </div>
  );
}
