import { isValidProductId } from "@/lib/productId";
import { DeleteConfirm } from "@/components/admin/DeleteConfirm";
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

export const Route = createFileRoute("/_authenticated/admin/produtos")({ staticData: { sitemap: false }, component: Products });

type Prod = Database["public"]["Tables"]["products"]["Row"];

function Products() {
  const { data, isLoading, isError } = useAllProducts();
  const { data: cats } = useAllCategories();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [kind, setKind] = useState<"" | "produto" | "kit">("");
  const [edit, setEdit] = useState<Partial<Prod> | null>(null);
  const { data: links } = useQuery({
    queryKey: ["admin-product-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_categories").select("product_id, category_id");
      if (error) throw error;
      return data;
    },
  });
  const catsOf = (p: Prod) => {
    const ids = new Set((links ?? []).filter((l) => l.product_id === p.id).map((l) => l.category_id));
    if (p.category_id) ids.add(p.category_id);
    return [...ids];
  };
  const catNames = (p: Prod) => catsOf(p).map((id) => cats?.find((c) => c.id === id)?.name).filter(Boolean).join(", ") || "Sem categoria";

  const list = useMemo(() => (data ?? []).filter((p) =>
    (!q || `${p.id} ${p.name}`.toLowerCase().includes(q.toLowerCase())) &&
    (!cat || catsOf(p).includes(cat)) && (!kind || (kind === "kit") === p.is_kit)), [data, q, cat, kind, links]);

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
              <span className="min-w-0 flex-1 basis-[calc(100%-4.5rem)] sm:basis-0">
                <span className="block font-medium sm:truncate">{p.name}{p.size_label ? ` · ${p.size_label}` : ""}</span>
                <span className="text-xs text-muted-foreground">{p.id} · {catNames(p)}</span>
              </span>
              <span className="ml-15 text-sm sm:ml-0 sm:text-right"><span className="block">{brl(p.price)}</span><span className="text-xs text-muted-foreground">Pro: {brl(p.pro_price)}</span></span>
              <span className="ml-auto flex flex-wrap gap-1">
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
  const [selCats, setSelCats] = useState<string[]>(prod.category_id ? [prod.category_id] : []);
  useQuery({
    queryKey: ["product-categories", prod.id],
    enabled: !isNew,
    queryFn: async () => {
      const { data, error } = await supabase.from("product_categories").select("category_id").eq("product_id", prod.id!);
      if (error) throw error;
      const ids = data.map((d) => d.category_id);
      setSelCats((cur) => [...new Set([...cur, ...ids])]);
      return data;
    },
  });
  const upload = async (f: File): Promise<void> => {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["jpg", "jpeg", "png", "webp"].includes(ext)) { toast.error("Use JPG, PNG ou WebP."); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error("A foto deve ter até 5 MB."); return; }
    setUploading(true);
    const path = `produtos/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, f, { contentType: f.type });
    setUploading(false);
    if (error) { toast.error("Não foi possível enviar a foto."); return; }
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
        category_id: selCats[0] ?? null,
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
      if (!isNew) row.id = String(prod.id ?? "");
      if (!row.id) throw new Error("Informe o ID do produto.");
      if (isNew && !isValidProductId(row.id)) throw new Error("O ID deve ser um número inteiro (ex.: 21919).");
      if (!row.name) throw new Error("Informe o nome do produto.");
      if (!(row.price >= 0)) throw new Error("Informe um preço válido.");
      if (row.pro_price != null && row.pro_price < 0) throw new Error("Preço profissional inválido.");
      if (isKit && !items?.length) throw new Error("Adicione ao menos um produto ao kit.");
      let error;
      if (isNew) {
        const dup = await supabase.from("products").select("id").eq("id", row.id).maybeSingle();
        if (dup.data) throw new Error(`O ID ${row.id} já está em uso por outro produto.`);
        ({ error } = await supabase.from("products").insert(row));
      } else {
        // Never change the primary key on edit; update only the existing row.
        const { id: _id, ...fields } = row;
        const res = await supabase.from("products").update(fields).eq("id", row.id).select("id");
        error = res.error;
        if (!error && !res.data?.length) throw new Error("Produto não encontrado para atualizar.");
      }
      if (error) throw new Error(error.code === "23505" ? "Já existe um produto com este ID." : "Não foi possível salvar o produto.");
      const delC = await supabase.from("product_categories").delete().eq("product_id", row.id);
      if (delC.error) throw new Error("Produto salvo, mas falhou ao atualizar as categorias.");
      if (selCats.length) {
        const insC = await supabase.from("product_categories").insert(selCats.map((category_id) => ({ product_id: row.id, category_id })));
        if (insC.error) throw new Error("Produto salvo, mas falhou ao gravar as categorias.");
      }
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
      qc.invalidateQueries({ queryKey: ["admin-product-categories"] }); qc.invalidateQueries({ queryKey: ["product-categories", prod.id] }); qc.invalidateQueries({ queryKey: ["catalog"] });
      qc.invalidateQueries({ queryKey: ["kit-items", prod.id] }); onDone();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const del = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("admin_delete_product", { _product_id: String(prod.id) });
      if (error) throw new Error(error.message || "Não foi possível excluir o produto.");
      const r = data as { image_url: string | null; image_shared: boolean; orders_changed: number };
      const marker = "/storage/v1/object/public/product-images/";
      if (r.image_url?.includes(marker) && !r.image_shared) {
        await supabase.storage.from("product-images").remove([decodeURIComponent(r.image_url.split(marker)[1] ?? "")]);
      }
      return r;
    },
    onSuccess: (r) => {
      toast.success(`Produto excluído definitivamente.${r.orders_changed ? ` ${r.orders_changed} pedido(s) atualizado(s).` : ""}`);
      qc.invalidateQueries();
      onDone();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  const candidates = all.filter((p) => !p.is_kit && !items?.some((i) => i.product_id === p.id));
  const nameOf = (id: string) => all.find((p) => p.id === id)?.name ?? id;

  return (
    <>
      <DialogHeader><DialogTitle className="font-display text-2xl">{isNew ? (isKit ? "Novo kit" : "Novo produto") : prod.name}</DialogTitle></DialogHeader>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); save.mutate(new FormData(e.currentTarget)); }}>
        <FieldRow label="ID / código (único)" hint={isNew ? "Não pode ser alterado depois." : undefined}><input name="id" className={`${inputCls} ${isNew ? "" : "cursor-not-allowed bg-muted text-muted-foreground"}`} defaultValue={prod.id} required readOnly={!isNew} aria-readonly={!isNew} /></FieldRow>
        <FieldRow label="Nome"><input name="name" className={inputCls} defaultValue={prod.name} required /></FieldRow>
        <FieldRow label="Categorias" hint="Marque uma ou mais. A primeira marcada é a principal.">
          <div className="flex max-h-40 flex-col gap-1 overflow-y-auto rounded-md border p-2">
            {!cats.length && <span className="text-xs text-muted-foreground">Nenhuma categoria cadastrada.</span>}
            {cats.map((c) => (
              <label key={c.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={selCats.includes(c.id)}
                  onChange={(e) => setSelCats((cur) => e.target.checked ? [...cur, c.id] : cur.filter((x) => x !== c.id))} />
                {c.name}
              </label>
            ))}
          </div>
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
      {!isNew && (
        <div className="border-t pt-4">
          <p className="mb-2 text-xs text-muted-foreground">Para apenas tirar da loja, use “Situação: Inativo”. A exclusão abaixo é permanente.</p>
          <DeleteConfirm label={isKit ? "Excluir kit" : "Excluir produto"} title={`Excluir “${prod.name}”`} pending={del.isPending} onConfirm={() => del.mutate()}
            items={["O cadastro do produto e sua foto (se não for usada por outro item)", "Vínculos com kits, promoções, cupons e seções da página inicial",
              "Favoritos, avisos de disponibilidade, avaliações e carrinhos", "Os itens deste produto em pedidos (os totais são recalculados; pedidos que ficarem vazios são excluídos)"]} />
        </div>
      )}
    </>
  );
}
