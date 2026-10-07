import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckList, useAllCategories, useAllProducts } from "@/components/admin/Pickers";
import { audienceLabel, brl, Empty, ErrorBox, FieldRow, fmtDate, fromLocalInput, inputCls, Loading, PageHead, Pill, toLocalInput } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/cupons")({ component: Coupons });

type Coupon = Database["public"]["Tables"]["coupons"]["Row"];

function Coupons() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase.from("coupons").select("*, coupon_products(product_id), coupon_categories(category_id)").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [edit, setEdit] = useState<(Partial<Coupon> & { products?: string[]; categories?: string[] }) | null>(null);
  return (
    <div>
      <PageHead title="Cupons" description="Regras: 1 cupom por pedido, sem combinação, e não vale para produtos em promoção."
        action={<Button variant="dark" onClick={() => setEdit({ status: "ativo", discount_type: "percentual", audience: "todos" })}><Plus className="size-4" /> Novo cupom</Button>} />
      {isLoading ? <Loading /> : isError ? <ErrorBox /> : !data?.length ? <Empty>Nenhum cupom cadastrado.</Empty> : (
        <div className="divide-y rounded-lg border">
          {data.map((c) => (
            <button key={c.id} className="flex w-full flex-wrap items-center gap-3 p-4 text-left hover:bg-accent/50"
              onClick={() => setEdit({ ...c, products: c.coupon_products.map((x) => x.product_id), categories: c.coupon_categories.map((x) => x.category_id) })}>
              <span className="min-w-0 flex-1">
                <span className="block font-mono font-medium tracking-wider">{c.code}</span>
                <span className="text-xs text-muted-foreground">
                  {c.discount_type === "percentual" ? `${c.discount_value}%` : brl(c.discount_value)} · {audienceLabel[c.audience]} · usos {c.uses_count}{c.max_uses ? `/${c.max_uses}` : ""} · até {fmtDate(c.ends_at)}
                </span>
              </span>
              <Pill tone={c.status === "ativo" ? "ok" : "off"}>{c.status === "ativo" ? "Ativo" : "Inativo"}</Pill>
            </button>
          ))}
        </div>
      )}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">{edit && <CouponForm c={edit} onDone={() => setEdit(null)} />}</DialogContent>
      </Dialog>
    </div>
  );
}

function CouponForm({ c, onDone }: { c: Partial<Coupon> & { products?: string[]; categories?: string[] }; onDone: () => void }) {
  const qc = useQueryClient();
  const isNew = !c.id;
  const { data: prods } = useAllProducts();
  const { data: cats } = useAllCategories();
  const [products, setProducts] = useState(c.products ?? []);
  const [categories, setCategories] = useState(c.categories ?? []);
  const save = useMutation({
    mutationFn: async (fd: FormData) => {
      const num = (k: string) => { const v = String(fd.get(k) ?? "").replace(",", "."); return v ? Number(v) : null; };
      const row = {
        code: String(fd.get("code")).trim().toUpperCase(),
        discount_type: fd.get("discount_type") as Coupon["discount_type"],
        discount_value: num("discount_value") ?? NaN,
        min_order_value: num("min_order_value"),
        max_uses: num("max_uses"),
        starts_at: fromLocalInput(String(fd.get("starts_at"))),
        ends_at: fromLocalInput(String(fd.get("ends_at"))),
        status: fd.get("status") as Coupon["status"],
        audience: fd.get("audience") as Coupon["audience"],
      };
      if (!/^[A-Z0-9_-]{3,30}$/.test(row.code)) throw new Error("Código: 3 a 30 letras, números, - ou _.");
      if (!(row.discount_value > 0)) throw new Error("Informe o valor do desconto.");
      if (row.discount_type === "percentual" && row.discount_value > 100) throw new Error("Percentual máximo é 100%.");
      if (row.starts_at && row.ends_at && row.ends_at <= row.starts_at) throw new Error("O fim da validade deve ser após o início.");
      const res = isNew ? await supabase.from("coupons").insert(row).select("id").single() : await supabase.from("coupons").update(row).eq("id", c.id!).select("id").single();
      if (res.error) throw new Error(res.error.code === "23505" ? "Já existe um cupom com este código." : "Não foi possível salvar o cupom.");
      const id = res.data.id;
      const r1 = await supabase.from("coupon_products").delete().eq("coupon_id", id);
      const r2 = await supabase.from("coupon_categories").delete().eq("coupon_id", id);
      const r3 = products.length ? await supabase.from("coupon_products").insert(products.map((product_id) => ({ coupon_id: id, product_id }))) : { error: null };
      const r4 = categories.length ? await supabase.from("coupon_categories").insert(categories.map((category_id) => ({ coupon_id: id, category_id }))) : { error: null };
      if (r1.error || r2.error || r3.error || r4.error) throw new Error("Cupom salvo, mas falhou ao gravar as restrições.");
    },
    onSuccess: () => { toast.success("Cupom salvo."); qc.invalidateQueries({ queryKey: ["admin-coupons"] }); onDone(); },
    onError: (e) => toast.error((e as Error).message),
  });
  return (
    <>
      <DialogHeader><DialogTitle className="font-display text-2xl">{isNew ? "Novo cupom" : `Cupom ${c.code}`}</DialogTitle></DialogHeader>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(new FormData(e.currentTarget)); }}>
        <FieldRow label="Código"><input name="code" className={`${inputCls} uppercase`} defaultValue={c.code} required /></FieldRow>
        <FieldRow label="Público">
          <select name="audience" className={inputCls} defaultValue={c.audience}>{Object.entries(audienceLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
        </FieldRow>
        <FieldRow label="Tipo de desconto">
          <select name="discount_type" className={inputCls} defaultValue={c.discount_type}><option value="percentual">Percentual (%)</option><option value="valor_fixo">Valor fixo (R$)</option></select>
        </FieldRow>
        <FieldRow label="Valor do desconto"><input name="discount_value" inputMode="decimal" className={inputCls} defaultValue={c.discount_value ?? ""} required /></FieldRow>
        <FieldRow label="Pedido mínimo (R$, opcional)"><input name="min_order_value" inputMode="decimal" className={inputCls} defaultValue={c.min_order_value ?? ""} /></FieldRow>
        <FieldRow label="Limite de usos (opcional)" hint={c.id ? `Usado ${c.uses_count ?? 0} vez(es).` : undefined}><input name="max_uses" type="number" min={1} className={inputCls} defaultValue={c.max_uses ?? ""} /></FieldRow>
        <FieldRow label="Válido a partir de"><input name="starts_at" type="datetime-local" className={inputCls} defaultValue={toLocalInput(c.starts_at ?? null)} /></FieldRow>
        <FieldRow label="Válido até"><input name="ends_at" type="datetime-local" className={inputCls} defaultValue={toLocalInput(c.ends_at ?? null)} /></FieldRow>
        <FieldRow label="Situação">
          <select name="status" className={inputCls} defaultValue={c.status}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select>
        </FieldRow>
        <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5"><p className="text-sm font-medium">Restringir a produtos <span className="font-normal text-muted-foreground">(vazio = todos)</span></p>
            <CheckList items={(prods ?? []).map((p) => ({ id: p.id, label: p.name, sub: p.is_kit ? "kit" : p.size_label ?? undefined }))} selected={products} onChange={setProducts} /></div>
          <div className="space-y-1.5"><p className="text-sm font-medium">Restringir a categorias <span className="font-normal text-muted-foreground">(vazio = todas)</span></p>
            <CheckList items={(cats ?? []).map((x) => ({ id: x.id, label: x.name }))} selected={categories} onChange={setCategories} /></div>
        </div>
        <Button variant="dark" className="sm:col-span-2" disabled={save.isPending}>{save.isPending ? "Salvando…" : "Salvar"}</Button>
      </form>
    </>
  );
}
