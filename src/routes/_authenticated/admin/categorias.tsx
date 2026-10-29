import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAllCategories } from "@/components/admin/Pickers";
import { DeleteConfirm } from "@/components/admin/DeleteConfirm";
import { areaCls, Empty, ErrorBox, FieldRow, inputCls, Loading, PageHead, Pill } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/categorias")({ staticData: { sitemap: false }, component: Categories });

type Cat = Database["public"]["Tables"]["categories"]["Row"];

function Categories() {
  const { data, isLoading, isError } = useAllCategories();
  const [edit, setEdit] = useState<Partial<Cat> | null>(null);
  return (
    <div>
      <PageHead
        title="Categorias"
        description="Categorias com produtos vinculados não são excluídas — use desativar."
        action={
          <Button variant="dark" onClick={() => setEdit({ status: "ativo", display_order: (data?.length ?? 0) + 1 })}>
            <Plus className="size-4" /> Nova categoria
          </Button>
        }
      />
      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorBox />
      ) : !data?.length ? (
        <Empty>Nenhuma categoria cadastrada.</Empty>
      ) : (
        <div className="divide-y rounded-lg border">
          {data.map((c) => (
            <button
              key={c.id}
              onClick={() => setEdit(c)}
              className="flex w-full flex-wrap items-center gap-3 p-4 text-left hover:bg-accent/50"
            >
              <span className="w-8 text-sm text-muted-foreground">{c.display_order}</span>
              <span className="flex-1">
                <span className="block font-medium">{c.name}</span>
                <span className="text-xs text-muted-foreground">{c.id}</span>
              </span>
              <span className="text-sm text-muted-foreground">{c.products?.[0]?.count ?? 0} produto(s)</span>
              <Pill tone={c.status === "ativo" ? "ok" : "off"}>{c.status === "ativo" ? "Ativa" : "Inativa"}</Pill>
            </button>
          ))}
        </div>
      )}
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="sm:max-w-lg">
          {edit && <CatForm cat={edit} onDone={() => setEdit(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CatForm({ cat, onDone }: { cat: Partial<Cat>; onDone: () => void }) {
  const qc = useQueryClient();
  const isNew = !cat.created_at;
  const save = useMutation({
    mutationFn: async (fd: FormData) => {
      const row = {
        id: isNew ? String(fd.get("id") ?? "").trim() : String(cat.id ?? ""),
        name: String(fd.get("name") ?? "").trim(),
        description: String(fd.get("description") || "").trim() || null,
        image_url: String(fd.get("image_url") || "").trim() || null,
        display_order: Number(fd.get("display_order") || 0),
        status: fd.get("status") as Cat["status"],
      };
      if (!row.id || ["null", "undefined"].includes(row.id) || !row.name)
        throw new Error("ID e nome são obrigatórios.");
      const { id: _id, ...updates } = row;
      const { error } = isNew
        ? await supabase.from("categories").insert(row)
        : await supabase.from("categories").update(updates).eq("id", cat.id!);
      if (error)
        throw new Error(error.code === "23505" ? "Já existe uma categoria com este ID." : "Não foi possível salvar.");
    },
    onSuccess: () => {
      toast.success("Categoria salva.");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      onDone();
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const del = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc("admin_delete_category", { _id: cat.id! });
      if (error) throw new Error(error.message);
    },
    onSuccess: () => {
      toast.success("Categoria excluída.");
      qc.invalidateQueries({ queryKey: ["admin-categories"] });
      qc.invalidateQueries({ queryKey: ["public-categories"] });
      onDone();
    },
    onError: (e) => toast.error((e as Error).message, { duration: 10000 }),
  });
  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-2xl">{isNew ? "Nova categoria" : "Editar categoria"}</DialogTitle>
      </DialogHeader>
      <form
        className="grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(new FormData(e.currentTarget));
        }}
      >
        <FieldRow label="ID (único)" hint={isNew ? "Ex.: shampoos. Não pode ser alterado depois." : undefined}>
          <input
            name="id"
            className={inputCls}
            defaultValue={cat.id}
            required
            readOnly={!isNew}
            pattern="[a-z0-9\-]+"
          />
        </FieldRow>
        <FieldRow label="Nome">
          <input name="name" className={inputCls} defaultValue={cat.name} required />
        </FieldRow>
        <FieldRow label="Descrição" className="sm:col-span-2">
          <textarea name="description" className={areaCls} defaultValue={cat.description ?? ""} />
        </FieldRow>
        <FieldRow label="Ordem de exibição">
          <input
            name="display_order"
            type="number"
            min={0}
            className={inputCls}
            defaultValue={cat.display_order ?? 0}
          />
        </FieldRow>
        <FieldRow label="Situação">
          <select name="status" className={inputCls} defaultValue={cat.status ?? "ativo"}>
            <option value="ativo">Ativa</option>
            <option value="inativo">Inativa</option>
          </select>
        </FieldRow>
        <Button variant="dark" className="sm:col-span-2" disabled={save.isPending}>
          {save.isPending ? "Salvando…" : "Salvar"}
        </Button>
      </form>
      {!isNew && (
        <div className="border-t pt-4">
          <DeleteConfirm
            label="Excluir categoria"
            title={`Excluir "${cat.name}"`}
            pending={del.isPending}
            onConfirm={() => del.mutate()}
            items={[
              "A categoria e sua descrição/imagem",
              "Não será excluída se houver produtos ou cupons vinculados — você verá o motivo",
            ]}
          />
        </div>
      )}
    </>
  );
}
