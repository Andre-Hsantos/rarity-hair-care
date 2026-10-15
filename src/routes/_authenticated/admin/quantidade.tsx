import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useAllProducts } from "@/components/admin/Pickers";
import { Empty, ErrorBox, FieldRow, inputCls, Loading, PageHead, Pill } from "@/components/admin/ui";
import { validateTier } from "@/lib/pricing";

export const Route = createFileRoute("/_authenticated/admin/quantidade")({ component: QuantityDiscounts });

const errMsg = (e: { message?: string; code?: string } | null) =>
  e?.code === "23505" ? "Já existe uma faixa com essa quantidade para este produto." : e?.message?.includes("conflitante") ? e.message : "Não foi possível salvar.";

function QuantityDiscounts() {
  const qc = useQueryClient();
  const { data: prods } = useAllProducts();
  const [productId, setProductId] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-qty"],
    queryFn: async () => {
      const { data, error } = await supabase.from("quantity_discounts").select("*").order("product_id").order("min_quantity");
      if (error) throw error;
      return data;
    },
  });
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-qty"] }); qc.invalidateQueries({ queryKey: ["qty-tiers"] }); qc.invalidateQueries({ queryKey: ["quote"] }); };
  const add = useMutation({
    mutationFn: async (fd: FormData) => {
      const min = Number(fd.get("min")); const pct = Number(String(fd.get("pct")).replace(",", "."));
      const err = validateTier(min, pct); if (err) throw new Error(err);
      if (!productId) throw new Error("Escolha um produto.");
      const { error } = await supabase.from("quantity_discounts").insert({ product_id: productId, min_quantity: min, percent: pct });
      if (error) throw new Error(errMsg(error));
    },
    onSuccess: () => { toast.success("Faixa adicionada."); refresh(); },
    onError: (e) => toast.error((e as Error).message),
  });
  const update = useMutation({
    mutationFn: async (v: { id: string; min_quantity?: number; percent?: number; status?: "ativo" | "inativo" }) => {
      const { id, ...row } = v;
      if (row.min_quantity != null || row.percent != null) { const err = validateTier(row.min_quantity ?? 2, row.percent ?? 1); if (err) throw new Error(err); }
      const { error } = await supabase.from("quantity_discounts").update(row).eq("id", id);
      if (error) throw new Error(errMsg(error));
    },
    onSuccess: () => { toast.success("Faixa atualizada."); refresh(); },
    onError: (e) => { toast.error((e as Error).message); refresh(); },
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("quantity_discounts").delete().eq("id", id); if (error) throw new Error("Não foi possível remover."); },
    onSuccess: () => { toast.success("Faixa removida."); refresh(); },
    onError: (e) => toast.error((e as Error).message),
  });

  const nameOf = (id: string) => prods?.find((p) => p.id === id)?.name ?? id;
  const groups = new Map<string, NonNullable<typeof data>>();
  (data ?? []).forEach((r) => groups.set(r.product_id, [...(groups.get(r.product_id) ?? []), r]));

  return (
    <div>
      <PageHead title="Desconto por quantidade" description="Faixas por produto. Vale só a maior faixa atingida; para profissionais aprovados, vale o maior entre a faixa e o desconto individual." />
      <form className="mb-8 grid gap-3 rounded-lg border bg-card p-4 sm:grid-cols-[1fr_140px_140px_auto] sm:items-end" onSubmit={(e) => { e.preventDefault(); add.mutate(new FormData(e.currentTarget)); e.currentTarget.reset(); }}>
        <FieldRow label="Produto">
          <select className={inputCls} value={productId} onChange={(e) => setProductId(e.target.value)} required>
            <option value="">Selecione…</option>
            {(prods ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}{p.size_label ? ` — ${p.size_label}` : ""}</option>)}
          </select>
        </FieldRow>
        <FieldRow label="A partir de (un.)"><input name="min" type="number" min={2} max={99} className={inputCls} required /></FieldRow>
        <FieldRow label="Desconto (%)"><input name="pct" inputMode="decimal" className={inputCls} required /></FieldRow>
        <Button variant="dark" disabled={add.isPending}><Plus className="size-4" /> Adicionar faixa</Button>
      </form>
      {isLoading ? <Loading /> : isError ? <ErrorBox /> : !groups.size ? <Empty>Nenhuma faixa cadastrada.</Empty> : (
        <div className="space-y-4">
          {[...groups].map(([pid, rows]) => (
            <div key={pid} className="rounded-lg border">
              <p className="border-b px-4 py-3 font-medium">{nameOf(pid)}</p>
              <div className="divide-y">
                {rows.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                    <label className="flex items-center gap-2">A partir de
                      <input type="number" min={2} max={99} defaultValue={r.min_quantity} className={`${inputCls} h-9 w-20`}
                        onBlur={(e) => Number(e.target.value) !== r.min_quantity && update.mutate({ id: r.id, min_quantity: Number(e.target.value) })} /> un.</label>
                    <label className="flex items-center gap-2">
                      <input inputMode="decimal" defaultValue={String(r.percent).replace(".", ",")} className={`${inputCls} h-9 w-20`}
                        onBlur={(e) => { const v = Number(e.target.value.replace(",", ".")); if (v !== Number(r.percent)) update.mutate({ id: r.id, percent: v }); }} /> %</label>
                    <span className="flex-1" />
                    <button type="button" onClick={() => update.mutate({ id: r.id, status: r.status === "ativo" ? "inativo" : "ativo" })}>
                      <Pill tone={r.status === "ativo" ? "ok" : "off"}>{r.status === "ativo" ? "Ativa" : "Inativa"}</Pill>
                    </button>
                    <Button type="button" variant="ghost" size="sm" aria-label="Remover faixa" onClick={() => confirm("Remover esta faixa?") && del.mutate(r.id)}><Trash2 className="size-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
