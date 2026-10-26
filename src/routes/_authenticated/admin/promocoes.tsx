import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckList, useAllProducts } from "@/components/admin/Pickers";
import { audienceLabel, brl, Empty, ErrorBox, FieldRow, fmtDate, fromLocalInput, inputCls, Loading, PageHead, Pill, toLocalInput } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/promocoes")({
  head: () => ({ meta: [
    { title: "Promoções | Administração Rarity Hair Care" },
    { name: "description", content: "Gerencie as promoções da Rarity Hair Care." },
    { property: "og:title", content: "Promoções | Administração Rarity Hair Care" },
    { property: "og:description", content: "Gerencie as promoções da Rarity Hair Care." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Promotions,
});

type Promo = Database["public"]["Tables"]["promotions"]["Row"];

function Promotions() {
  const qc = useQueryClient();
  const del = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from("promotions").delete().eq("id", id).select("id");
      if (error || !data?.length) throw new Error("Não foi possível excluir a promoção.");
    },
    onSuccess: () => {
      toast.success("Promoção excluída.");
      for (const key of ["admin-promotions", "catalog", "quote"]) {
        qc.invalidateQueries({ queryKey: [key] });
      }
    },
    onError: (e) => toast.error(e.message),
  });
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-promotions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("promotions").select("*, promotion_products(product_id)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [edit, setEdit] = useState<(Partial<Promo> & { products?: string[] }) | null>(null);
  return (
    <div>
      <PageHead title="Promoções" description="A promoção é uma regra separada: o preço base do produto não é alterado."
        action={<Button variant="dark" onClick={() => setEdit({ status: "ativo", discount_type: "percentual", audience: "todos" })}><Plus className="size-4" /> Nova promoção</Button>} />
      {isLoading ? <Loading /> : isError ? <ErrorBox /> : !data?.length ? <Empty>Nenhuma promoção cadastrada.</Empty> : (
        <div className="divide-y rounded-lg border">
          {data.map((p) => (
            <div key={p.id} className="flex items-center gap-2 p-4 hover:bg-accent/50">
              <Button variant="ghost" className="h-auto min-w-0 flex-1 flex-wrap justify-start gap-3 whitespace-normal p-0 text-left"
                onClick={() => setEdit({ ...p, products: p.promotion_products.map((x) => x.product_id) })}>
              <span className="min-w-0 flex-1">
                <span className="block break-words font-medium">{p.name}</span>
                <span className="text-xs text-muted-foreground">
                  {p.discount_type === "percentual" ? `${p.discount_value}%` : brl(p.discount_value)} · {audienceLabel[p.audience]} · {p.promotion_products.length} item(ns) · {fmtDate(p.starts_at)} → {fmtDate(p.ends_at)}
                </span>
              </span>
              <Pill tone={p.status === "ativo" ? "ok" : "off"}>{p.status === "ativo" ? "Ativa" : "Inativa"}</Pill>
              </Button>
              <Button type="button" variant="ghost" size="icon" className="shrink-0 text-destructive" aria-label={`Excluir promoção ${p.name}`} title="Excluir promoção" disabled={del.isPending}
                onClick={() => confirm(`Excluir a promoção "${p.name}"? Esta ação não pode ser desfeita.`) && del.mutate(p.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">{edit && <PromoForm p={edit} onDone={() => setEdit(null)} />}</DialogContent>
      </Dialog>
    </div>
  );
}

function PromoForm({ p, onDone }: { p: Partial<Promo> & { products?: string[] }; onDone: () => void }) {
  const qc = useQueryClient();
  const isNew = !p.id;
  const { data: prods } = useAllProducts();
  const [products, setProducts] = useState(p.products ?? []);
  const save = useMutation({
    mutationFn: async (fd: FormData) => {
      const row = {
        name: String(fd.get("name")).trim(),
        discount_type: fd.get("discount_type") as Promo["discount_type"],
        discount_value: Number(String(fd.get("discount_value")).replace(",", ".")),
        starts_at: fromLocalInput(String(fd.get("starts_at"))),
        ends_at: fromLocalInput(String(fd.get("ends_at"))),
        status: fd.get("status") as Promo["status"],
        audience: fd.get("audience") as Promo["audience"],
      };
      if (!row.name) throw new Error("Informe o nome.");
      if (!(row.discount_value > 0)) throw new Error("Informe o valor do desconto.");
      if (row.discount_type === "percentual" && row.discount_value > 100) throw new Error("Percentual máximo é 100%.");
      if (row.starts_at && row.ends_at && row.ends_at <= row.starts_at) throw new Error("O fim deve ser após o início.");
      if (!products.length) throw new Error("Selecione ao menos um produto ou kit.");
      const res = isNew ? await supabase.from("promotions").insert(row).select("id").single() : await supabase.from("promotions").update(row).eq("id", p.id!).select("id").single();
      if (res.error) throw new Error("Não foi possível salvar a promoção.");
      const id = res.data.id;
      const d = await supabase.from("promotion_products").delete().eq("promotion_id", id);
      const i = await supabase.from("promotion_products").insert(products.map((product_id) => ({ promotion_id: id, product_id })));
      if (d.error || i.error) throw new Error("Promoção salva, mas falhou ao gravar os produtos.");
    },
    onSuccess: () => { toast.success("Promoção salva."); qc.invalidateQueries({ queryKey: ["admin-promotions"] }); onDone(); },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <>
      <DialogHeader><DialogTitle className="font-display text-2xl">{isNew ? "Nova promoção" : p.name}</DialogTitle></DialogHeader>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(new FormData(e.currentTarget)); }}>
        <FieldRow label="Nome" className="sm:col-span-2"><input name="name" className={inputCls} defaultValue={p.name} required /></FieldRow>
        <FieldRow label="Tipo de desconto">
          <select name="discount_type" className={inputCls} defaultValue={p.discount_type}><option value="percentual">Percentual (%)</option><option value="valor_fixo">Valor fixo (R$ por item)</option></select>
        </FieldRow>
        <FieldRow label="Valor do desconto"><input name="discount_value" inputMode="decimal" className={inputCls} defaultValue={p.discount_value ?? ""} required /></FieldRow>
        <FieldRow label="Início"><input name="starts_at" type="datetime-local" className={inputCls} defaultValue={toLocalInput(p.starts_at ?? null)} /></FieldRow>
        <FieldRow label="Fim"><input name="ends_at" type="datetime-local" className={inputCls} defaultValue={toLocalInput(p.ends_at ?? null)} /></FieldRow>
        <FieldRow label="Público">
          <select name="audience" className={inputCls} defaultValue={p.audience}>{Object.entries(audienceLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </FieldRow>
        <FieldRow label="Situação">
          <select name="status" className={inputCls} defaultValue={p.status}><option value="ativo">Ativa</option><option value="inativo">Inativa</option></select>
        </FieldRow>
        <div className="space-y-1.5 sm:col-span-2"><p className="text-sm font-medium">Produtos e kits da promoção</p>
          <CheckList items={(prods ?? []).map((x) => ({ id: x.id, label: x.name, sub: x.is_kit ? "kit" : x.size_label ?? undefined }))} selected={products} onChange={setProducts} /></div>
        <Button variant="dark" className="sm:col-span-2" disabled={save.isPending}>{save.isPending ? "Salvando…" : "Salvar"}</Button>
      </form>
    </>
  );
}
