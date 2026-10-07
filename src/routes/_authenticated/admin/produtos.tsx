import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAllCategories, useAllProducts } from "@/components/admin/Pickers";
import { areaCls, brl, Empty, ErrorBox, FieldRow, inputCls, Loading, PageHead, Pill } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/produtos")({ component: Products });

type Prod = Database["public"]["Tables"]["products"]["Row"];

function Products() {
  const { data, isLoading, isError } = useAllProducts();
  const { data: cats } = useAllCategories();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [kind, setKind] = useState<"" | "produto" | "kit">("");
  const [edit, setEdit] = useState<Partial<Prod> | null>(null);
  const catName = (id: string | null) => cats?.find((c) => c.id === id)?.name ?? "Sem categoria";

  const list = useMemo(() => (data ?? []).filter((p) =>
    (!q || `${p.id} ${p.name}`.toLowerCase().includes(q.toLowerCase())) &&
    (!cat || p.category_id === cat) && (!kind || (kind === "kit") === p.is_kit)), [data, q, cat, kind]);

  return (
    <div>
      <PageHead title="Produtos e kits" description="Cada tamanho é cadastrado como um produto separado (use “grupo de tamanhos” para relacioná-los). Kits têm preço definido manualmente."
        action={<div className="flex gap-2">
          <Button variant="outline" onClick={() => setEdit({ is_kit: true, status: "ativo", availability: "disponivel", audience: "todos" })}><Plus className="size-4" /> Novo kit</Button>
          <Button variant="dark" onClick={() => setEdit({ is_kit: false, status: "ativo", availability: "disponivel", audience: "todos" })}><Plus className="size-4" /> Novo produto</Button>
        </div>} />
      <div className="mb-4 grid gap-2 sm:grid-cols-[1fr_200px_150px]">
        <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input className={`${inputCls} pl-9`} placeholder="Buscar por nome ou ID" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <select className={inputCls} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">Todas as categorias</option>{cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
          <option value="">Produtos e kits</option><option value="produto">Só produtos</option><option value="kit">Só kits</option>
        </select>
      </div>
      {isLoading ? <Loading /> : isError ? <ErrorBox /> : !list.length ? <Empty>{data?.length ? "Nenhum produto corresponde aos filtros." : "Nenhum produto cadastrado."}</Empty> : (
        <div className="divide-y rounded-lg border">
          {list.map((p) => (
            <button key={p.id} onClick={() => setEdit(p)} className="flex w-full flex-wrap items-center gap-3 p-3 text-left hover:bg-accent/50">
              <span className="size-12 shrink-0 overflow-hidden rounded bg-surface">{p.image_url && <img src={p.image_url} alt="" className="size-full object-cover" />}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{p.name}{p.size_label ? ` · ${p.size_label}` : ""}</span>
                <span className="text-xs text-muted-foreground">{p.id} · {catName(p.category_id)}</span>
              </span>
              <span className="text-right text-sm"><span className="block">{brl(p.price)}</span><span className="text-xs text-muted-foreground">Pro: {brl(p.pro_price)}</span></span>
              <span className="flex flex-wrap gap-1">
                {p.is_kit && <Pill tone="warn">Kit</Pill>}
                {p.audience === "profissionais" && <Pill>Só profissionais</Pill>}
                {p.availability === "esgotado" && <Pill tone="bad">Esgotado</Pill>}
                <Pill tone={p.status === "ativo" ? "ok" : "off"}>{p.status === "ativo" ? "Ativo" : "Inativo"}</Pill>
              </span>
            </button>
          ))}
        </div>
      )}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">{edit && <ProdForm prod={edit} all={data ?? []} cats={cats ?? []} onDone={() => setEdit(null)} />}</DialogContent>
      </Dialog>
    </div>
  );
}

function ProdForm({ prod, all, cats, onDone }: { prod: Partial<Prod>; all: Prod[]; cats: { id: string; name: string }[]; onDone: () => void }) {
  const qc = useQueryClient();
  const isNew = !prod.created_at;
  const isKit = !!prod.is_kit;
  const [items, setItems] = useState<{ product_id: string; quantity: number }[] | null>(isNew ? [] : null);
  const [pick, setPick] = useState("");
  const [img, setImg] = useState(prod.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const upload = async (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["jpg", "jpeg", "png", "webp"].includes(ext)) return toast.error("Use JPG, PNG ou WebP.");
    if (f.size > 5 * 1024 * 1024) return toast.error("A foto deve ter até 5 MB.");
    setUploading(true);
    const path = `produtos/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, f, { contentType: f.type });
    setUploading(false);
    if (error) return toast.error("Não foi possível enviar a foto.");
    setImg(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
    toast.success("Foto enviada. Clique em salvar para confirmar.");
  };

  useQuery({
    queryKey: ["kit-items", prod.id],
    enabled: isKit && !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("kit_items").select("product_id, quantity").eq("kit_id", prod.id!);
      if (error) throw error;
      setItems(data);
      return data;
    },
  });

  const save = useMutation({
    mutationFn: async (fd: FormData) => {
      const num = (k: string) => { const v = String(fd.get(k) ?? "").replace(",", "."); return v ? Number(v) : null; };
      const row = {
        id: String(fd.get("id")).trim(),
        name: String(fd.get("name")).trim(),
        category_id: String(fd.get("category_id") || "") || null,
        description: String(fd.get("description") || "").trim() || null,
        image_url: String(fd.get("image_url") || "").trim() || null,
        price: num("price") ?? NaN,
        pro_price: num("pro_price"),
        audience: fd.get("audience") as Prod["audience"],
        availability: fd.get("availability") as Prod["availability"],
        status: fd.get("status") as Prod["status"],
        is_kit: isKit,
        size_group: String(fd.get("size_group") || "").trim() || null,
        size_label: String(fd.get("size_label") || "").trim() || null,
      };
      if (!row.id || !row.name) throw new Error("ID e nome são obrigatórios.");
      if (!(row.price >= 0)) throw new Error("Informe um preço válido.");
      if (row.pro_price != null && row.pro_price < 0) throw new Error("Preço profissional inválido.");
      if (isKit && !items?.length) throw new Error("Adicione ao menos um produto ao kit.");
      const { error } = isNew ? await supabase.from("products").insert(row) : await supabase.from("products").update(row).eq("id", prod.id!);
      if (error) throw new Error(error.code === "23505" ? "Já existe um produto com este ID." : "Não foi possível salvar o produto.");
      if (isKit && items) {
        const del = await supabase.from("kit_items").delete().eq("kit_id", row.id);
        if (del.error) throw new Error("Produto salvo, mas falhou ao atualizar a composição do kit.");
        const ins = await supabase.from("kit_items").insert(items.map((i) => ({ kit_id: row.id, ...i })));
        if (ins.error) throw new Error("Produto salvo, mas falhou ao gravar a composição do kit.");
      }
    },
    onSuccess: () => {
      toast.success(isKit ? "Kit salvo." : "Produto salvo.");
      qc.invalidateQueries({ queryKey: ["admin-products"] }); qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["kit-items", prod.id] }); onDone();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const candidates = all.filter((p) => !p.is_kit && !items?.some((i) => i.product_id === p.id));
  const nameOf = (id: string) => all.find((p) => p.id === id)?.name ?? id;

  return (
    <>
      <DialogHeader><DialogTitle className="font-display text-2xl">{isNew ? (isKit ? "Novo kit" : "Novo produto") : prod.name}</DialogTitle></DialogHeader>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(new FormData(e.currentTarget)); }}>
        <FieldRow label="ID / código (único)" hint={isNew ? "Não pode ser alterado depois." : undefined}><input name="id" className={inputCls} defaultValue={prod.id} required disabled={!isNew} /></FieldRow>
        <FieldRow label="Nome"><input name="name" className={inputCls} defaultValue={prod.name} required /></FieldRow>
        <FieldRow label="Categoria">
          <select name="category_id" className={inputCls} defaultValue={prod.category_id ?? ""}><option value="">Sem categoria</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </FieldRow>
        <FieldRow label="Foto do produto" hint="JPG, PNG ou WebP até 5 MB. Quadrada, 1000×1000 px recomendado.">
          <div className="flex items-center gap-3">
            <span className="size-16 shrink-0 overflow-hidden rounded border bg-surface">{img && <img src={img} alt="" className="size-full object-cover" />}</span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <label className={`${inputCls} cursor-pointer text-center`}>
                {uploading ? "Enviando..." : img ? "Trocar foto" : "Enviar foto"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }} />
              </label>
              <input name="image_url" type="url" placeholder="ou cole um link" className={inputCls} value={img} onChange={(e) => setImg(e.target.value)} />
            </div>
          </div>
        </FieldRow>
        <FieldRow label="Descrição" className="sm:col-span-2"><textarea name="description" className={areaCls} defaultValue={prod.description ?? ""} /></FieldRow>
        <FieldRow label={isKit ? "Preço do kit (R$, manual)" : "Preço normal (R$)"}><input name="price" inputMode="decimal" className={inputCls} defaultValue={prod.price ?? ""} required /></FieldRow>
        <FieldRow label="Preço profissional (R$)" hint="Vazio = mesmo preço normal."><input name="pro_price" inputMode="decimal" className={inputCls} defaultValue={prod.pro_price ?? ""} /></FieldRow>
        <FieldRow label="Público">
          <select name="audience" className={inputCls} defaultValue={prod.audience}><option value="todos">Todos</option><option value="profissionais">Somente profissionais</option></select>
        </FieldRow>
        <FieldRow label="Disponibilidade">
          <select name="availability" className={inputCls} defaultValue={prod.availability}><option value="disponivel">Disponível</option><option value="esgotado">Esgotado</option></select>
        </FieldRow>
        {!isKit && <>
          <FieldRow label="Grupo de tamanhos" hint="Mesmo valor em todos os tamanhos do produto."><input name="size_group" className={inputCls} defaultValue={prod.size_group ?? ""} /></FieldRow>
          <FieldRow label="Tamanho" hint="Ex.: 300 ml, 1 L"><input name="size_label" className={inputCls} defaultValue={prod.size_label ?? ""} /></FieldRow>
        </>}
        <FieldRow label="Situação">
          <select name="status" className={inputCls} defaultValue={prod.status}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select>
        </FieldRow>
        {isKit && (
          <div className="space-y-2 sm:col-span-2">
            <p className="text-sm font-medium">Composição do kit</p>
            {items === null ? <Loading /> : <>
              {items.map((i, idx) => (
                <div key={i.product_id} className="flex items-center gap-2 rounded-md border p-2 text-sm">
                  <span className="flex-1">{nameOf(i.product_id)}</span>
                  <input type="number" min={1} value={i.quantity} className={`${inputCls} w-20`}
                    onChange={(e) => setItems(items.map((x, j) => j === idx ? { ...x, quantity: Math.max(1, Number(e.target.value)) } : x))} />
                  <button type="button" aria-label="Remover" onClick={() => setItems(items.filter((_, j) => j !== idx))} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                </div>
              ))}
              <div className="flex gap-2">
                <select className={inputCls} value={pick} onChange={(e) => setPick(e.target.value)}>
                  <option value="">Escolher produto…</option>{candidates.map((p) => <option key={p.id} value={p.id}>{p.name}{p.size_label ? ` · ${p.size_label}` : ""}</option>)}
                </select>
                <Button type="button" variant="outline" disabled={!pick} onClick={() => { setItems([...items, { product_id: pick, quantity: 1 }]); setPick(""); }}>Adicionar</Button>
              </div>
            </>}
          </div>
        )}
        <Button variant="dark" className="sm:col-span-2" disabled={save.isPending}>{save.isPending ? "Salvando…" : "Salvar"}</Button>
      </form>
    </>
  );
}
