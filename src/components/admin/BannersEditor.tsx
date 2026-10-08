import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ImageOff, Plus } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { areaCls, Empty, ErrorBox, FieldRow, inputCls, Loading, Pill } from "./ui";
import { DeleteConfirm } from "./DeleteConfirm";

type Banner = Database["public"]["Tables"]["banners"]["Row"];
export const KITS_PLACEMENT = "home_kits";

/** Banners of the Home "Kits Rarity" area. With none active, the site keeps its built-in kits banner. */
export function BannersEditor() {
  const qc = useQueryClient();
  const list = useQuery({
    queryKey: ["admin-banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banners").select("*").eq("placement", KITS_PLACEMENT).order("display_order").order("created_at");
      if (error) throw error;
      return data;
    },
  });
  const [edit, setEdit] = useState<Partial<Banner> | null>(null);
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-banners"] }); qc.invalidateQueries({ queryKey: ["home-banners"] }); };
  const move = useMutation({
    mutationFn: async ({ i, dir }: { i: number; dir: -1 | 1 }) => {
      const arr = [...(list.data ?? [])];
      const j = i + dir;
      if (j < 0 || j >= arr.length) return;
      [arr[i], arr[j]] = [arr[j]!, arr[i]!];
      for (const [k, b] of arr.entries()) {
        const { error } = await supabase.from("banners").update({ display_order: k + 1 }).eq("id", b.id);
        if (error) throw error;
      }
    },
    onSuccess: refresh,
    onError: () => toast.error("Não foi possível reordenar."),
  });
  const data = list.data ?? [];
  return (
    <section className="rounded-lg border p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl">Carrossel de banners da Home</h2>
          <p className="text-sm text-muted-foreground">Cada item é um slide do carrossel no topo da página inicial, exibido na ordem abaixo. Slides inativos não aparecem. Sem slide ativo, o site mostra o banner padrão de Kits Rarity.</p>
        </div>
        <Button variant="dark" onClick={() => setEdit({ status: "ativo", display_order: data.length + 1, placement: KITS_PLACEMENT })}><Plus className="size-4" /> Adicionar slide</Button>
      </div>
      <div className="mt-4">
        {list.isLoading ? <Loading /> : list.isError ? <ErrorBox /> : !data.length ? <Empty>Nenhum slide cadastrado — o banner padrão de Kits Rarity está sendo exibido.</Empty> : (
          <div className="divide-y rounded-lg border">
            {data.map((b, i) => (
              <div key={b.id} className="flex flex-wrap items-center gap-3 p-3">
                <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded bg-surface">
                  {b.image_url ? <img src={b.image_url} alt="" className="h-full w-full object-cover" /> : <ImageOff className="size-5 text-muted-foreground" />}
                </span>
                <button className="min-w-0 flex-1 text-left" onClick={() => setEdit(b)}>
                  <span className="block font-medium">{i + 1}. {b.title || "Sem título"}</span>
                  <span className="block truncate text-xs text-muted-foreground">{b.subtitle || "—"}</span>
                </button>
                <Pill tone={b.status === "ativo" ? "ok" : "off"}>{b.status === "ativo" ? "Ativo" : "Inativo"}</Pill>
                <div className="flex gap-1">
                  <Button size="icon" variant="outline" aria-label="Subir" disabled={i === 0 || move.isPending} onClick={() => move.mutate({ i, dir: -1 })}><ArrowUp className="size-4" /></Button>
                  <Button size="icon" variant="outline" aria-label="Descer" disabled={i === data.length - 1 || move.isPending} onClick={() => move.mutate({ i, dir: 1 })}><ArrowDown className="size-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Dialog open={!!edit} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">{edit && <BannerForm b={edit} onDone={() => { setEdit(null); refresh(); }} />}</DialogContent>
      </Dialog>
    </section>
  );
}

function BannerForm({ b, onDone }: { b: Partial<Banner>; onDone: () => void }) {
  const isNew = !b.id;
  const [img, setImg] = useState(b.image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const upload = async (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!["jpg", "jpeg", "png", "webp"].includes(ext)) { toast.error("Use JPG, PNG ou WebP."); return; }
    if (f.size > 5 * 1024 * 1024) { toast.error("A imagem deve ter até 5 MB."); return; }
    setUploading(true);
    const path = `banners/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, f, { contentType: f.type });
    setUploading(false);
    if (error) { toast.error("Não foi possível enviar a imagem."); return; }
    setImg(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
  };
  const save = useMutation({
    mutationFn: async (fd: FormData) => {
      const s = (k: string) => String(fd.get(k) ?? "").trim() || null;
      const link = s("link");
      if (link && !link.startsWith("/") && !/^https:\/\//.test(link)) throw new Error("O link deve começar com / (página do site) ou https://");
      const row = {
        title: s("title"), subtitle: s("subtitle"), button_label: s("button_label"), link, image_url: img || null,
        status: fd.get("status") as Banner["status"], placement: KITS_PLACEMENT, display_order: b.display_order ?? 1,
      };
      const { error } = isNew ? await supabase.from("banners").insert(row) : await supabase.from("banners").update(row).eq("id", b.id!);
      if (error) throw new Error("Não foi possível salvar o slide.");
    },
    onSuccess: () => { toast.success("Slide salvo."); onDone(); },
    onError: (e) => toast.error((e as Error).message),
  });
  const del = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("banners").delete().eq("id", b.id!); if (error) throw error; },
    onSuccess: () => { toast.success("Slide excluído."); onDone(); },
    onError: () => toast.error("Não foi possível excluir."),
  });
  return (
    <>
      <DialogHeader><DialogTitle className="font-display text-2xl">{isNew ? "Novo slide" : "Editar slide"}</DialogTitle></DialogHeader>
      <form className="grid gap-3" onSubmit={(e) => { e.preventDefault(); save.mutate(new FormData(e.currentTarget)); }}>
        <FieldRow label="Imagem">
          <div className="flex items-center gap-3">
            <span className="grid size-20 shrink-0 place-items-center overflow-hidden rounded bg-surface">{img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <ImageOff className="size-5 text-muted-foreground" />}</span>
            <label className="cursor-pointer rounded-md border px-3 py-2 text-sm hover:bg-accent">
              {uploading ? "Enviando..." : img ? "Trocar imagem" : "Enviar imagem"}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); e.target.value = ""; }} />
            </label>
            {img && <button type="button" className="text-xs text-muted-foreground hover:underline" onClick={() => setImg("")}>Remover</button>}
          </div>
        </FieldRow>
        <FieldRow label="Título"><input name="title" className={inputCls} maxLength={120} defaultValue={b.title ?? ""} /></FieldRow>
        <FieldRow label="Texto"><textarea name="subtitle" className={areaCls} maxLength={400} defaultValue={b.subtitle ?? ""} /></FieldRow>
        <FieldRow label="Texto do botão (opcional)"><input name="button_label" className={inputCls} maxLength={40} defaultValue={b.button_label ?? ""} placeholder="Ex.: Ver kits" /></FieldRow>
        <FieldRow label="Link do botão (opcional)" hint="Ex.: /produtos?tipo=kit"><input name="link" className={inputCls} defaultValue={b.link ?? ""} /></FieldRow>
        <FieldRow label="Situação">
          <select name="status" className={inputCls} defaultValue={b.status ?? "ativo"}><option value="ativo">Ativo</option><option value="inativo">Inativo</option></select>
        </FieldRow>
        <Button variant="dark" disabled={save.isPending || uploading}>{save.isPending ? "Salvando…" : "Salvar"}</Button>
      </form>
      {!isNew && <div className="border-t pt-4"><DeleteConfirm label="Excluir slide" title="Excluir slide" pending={del.isPending} onConfirm={() => del.mutate()} items={["Este slide (a imagem enviada permanece no armazenamento)"]} /></div>}
    </>
  );
}
