import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAllProducts } from "@/components/admin/Pickers";
import { Empty, ErrorBox, inputCls, Loading, PageHead, Pill } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { BannersEditor } from "@/components/admin/BannersEditor";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({ component: Settings });

type Section = "featured" | "best_sellers";

function Settings() {
  return (
    <>
      <PageHead title="Configurações" description="Escolha manualmente os produtos exibidos nas seções da página inicial. Seção vazia não aparece no site." />
      <div className="space-y-10">
        <SectionEditor section="featured" title="Produtos em destaque" />
        <SectionEditor section="best_sellers" title="Produtos mais vendidos" hint="Curadoria manual — não é calculado pelas vendas." />
        <BannersEditor />
      </div>
    </>
  );
}

function SectionEditor({ section, title, hint }: { section: Section; title: string; hint?: string }) {
  const qc = useQueryClient();
  const products = useAllProducts();
  const saved = useQuery({
    queryKey: ["home-section", section],
    queryFn: async () => {
      const { data, error } = await supabase.from("home_section_products").select("product_id").eq("section", section).order("position");
      if (error) throw error;
      return data.map((d) => d.product_id);
    },
  });
  const [draft, setDraft] = useState<string[] | null>(null);
  const [q, setQ] = useState("");
  const ids = draft ?? saved.data ?? [];
  const byId = useMemo(() => new Map((products.data ?? []).map((p) => [p.id, p])), [products.data]);
  const results = (products.data ?? []).filter((p) => !ids.includes(p.id) && q && `${p.id} ${p.name}`.toLowerCase().includes(q.toLowerCase())).slice(0, 20);

  const save = useMutation({
    mutationFn: async () => {
      const del = await supabase.from("home_section_products").delete().eq("section", section);
      if (del.error) throw del.error;
      if (ids.length) {
        const ins = await supabase.from("home_section_products").insert(ids.map((product_id, position) => ({ section, product_id, position })));
        if (ins.error) throw ins.error;
      }
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["home-section", section] });
      setDraft(null);
      toast.success("Seleção salva");
    },
    onError: () => toast.error("Não foi possível salvar."),
  });

  const move = (i: number, d: number) => {
    const n = [...ids];
    [n[i], n[i + d]] = [n[i + d]!, n[i]!];
    setDraft(n);
  };

  return (
    <section className="rounded-lg border p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl">{title}</h2>
          <p className="text-sm text-muted-foreground">{ids.length} produto(s) selecionado(s){hint ? ` · ${hint}` : ""}</p>
        </div>
        <div className="flex gap-2">
          {draft && <Button variant="outline" onClick={() => setDraft(null)}>Descartar</Button>}
          <Button variant="dark" disabled={!draft || save.isPending} onClick={() => save.mutate()}>Salvar</Button>
        </div>
      </div>

      {products.isLoading || saved.isLoading ? <Loading /> : products.isError || saved.isError ? <ErrorBox /> : (
        <>
          <div className="relative mt-4">
            <input className={inputCls} placeholder="Buscar produto ou kit por nome ou ID para adicionar…" value={q} onChange={(e) => setQ(e.target.value)} />
            {!!results.length && (
              <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-card p-1 shadow-card">
                {results.map((p) => (
                  <li key={p.id}>
                    <button className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left text-sm hover:bg-accent" onClick={() => { setDraft([...ids, p.id]); setQ(""); }}>
                      <span className="flex-1">{p.name}</span>
                      {p.is_kit && <Pill tone="warn">Kit</Pill>}
                      {p.status !== "ativo" && <Pill>Inativo</Pill>}
                      <span className="text-xs text-muted-foreground">{p.id}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="mt-4">
            {!ids.length ? <Empty>Nenhum produto selecionado — a seção ficará oculta na página inicial.</Empty> : (
              <ol className="divide-y rounded-md border">
                {ids.map((id, i) => {
                  const p = byId.get(id);
                  return (
                    <li key={id} className="flex items-center gap-3 px-3 py-2 text-sm">
                      <span className="w-6 text-muted-foreground">{i + 1}.</span>
                      <span className="flex-1">{p?.name ?? id}</span>
                      {p?.is_kit && <Pill tone="warn">Kit</Pill>}
                      {p && p.status !== "ativo" && <Pill>Inativo (não aparece)</Pill>}
                      <button aria-label="Subir" disabled={i === 0} onClick={() => move(i, -1)} className="rounded p-1 hover:bg-accent disabled:opacity-30"><ArrowUp className="size-4" /></button>
                      <button aria-label="Descer" disabled={i === ids.length - 1} onClick={() => move(i, 1)} className="rounded p-1 hover:bg-accent disabled:opacity-30"><ArrowDown className="size-4" /></button>
                      <button aria-label="Remover" onClick={() => setDraft(ids.filter((x) => x !== id))} className="rounded p-1 text-destructive hover:bg-destructive/10"><X className="size-4" /></button>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </>
      )}
    </section>
  );
}
