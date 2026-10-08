import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Empty, ErrorBox, FieldRow, fmtDate, inputCls, Loading, PageHead, Pill } from "@/components/admin/ui";
import { DeleteConfirm } from "@/components/admin/DeleteConfirm";
import { deleteClient } from "@/lib/adminDelete.functions";

export const Route = createFileRoute("/_authenticated/admin/clientes")({ component: Clients });

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
const proLabel = { nao_solicitado: "Não solicitado", em_analise: "Em análise", aprovado: "Aprovado", rejeitado: "Rejeitado" } as const;

function Clients() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Profile | null>(null);
  const list = useMemo(() => {
    const s = q.trim().toLowerCase(); const d = s.replace(/\D/g, "");
    return (data ?? []).filter((p) => !s || p.name.toLowerCase().includes(s) || p.email.toLowerCase().includes(s) || (d && p.phone?.replace(/\D/g, "").includes(d)));
  }, [data, q]);

  return (
    <div>
      <PageHead title="Clientes" description="E-mail e CPF não são editáveis pelo painel." />
      <div className="relative mb-4 sm:max-w-sm"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input className={`${inputCls} pl-9`} placeholder="Buscar por nome, e-mail ou telefone" value={q} onChange={(e) => setQ(e.target.value)} /></div>
      {isLoading ? <Loading /> : isError ? <ErrorBox /> : !list.length ? <Empty>{data?.length ? "Nenhum cliente encontrado." : "Nenhum cliente cadastrado."}</Empty> : (
        <div className="divide-y rounded-lg border">
          {list.map((p) => (
            <button key={p.id} onClick={() => setOpen(p)} className="flex w-full flex-wrap items-center gap-3 p-4 text-left hover:bg-accent/50">
              <span className="min-w-0 flex-1"><span className="block font-medium">{p.name || "Sem nome"}</span><span className="text-sm text-muted-foreground">{p.email} · {p.phone || "sem telefone"}</span></span>
              <Pill tone={p.account_type === "profissional" ? "warn" : "off"}>{p.account_type === "profissional" ? "Profissional" : "Comum"}</Pill>
              {p.account_status === "excluida" && <Pill tone="bad">Excluída</Pill>}
            </button>
          ))}
        </div>
      )}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">{open && <ClientDetail p={open} onDone={() => setOpen(null)} />}</DialogContent>
      </Dialog>
    </div>
  );
}

function ClientDetail({ p, onDone }: { p: Profile; onDone: () => void }) {
  const qc = useQueryClient();
  const [disc, setDisc] = useState(String(p.individual_discount_percent ?? 0));
  const extra = useQuery({
    queryKey: ["admin-client", p.id],
    queryFn: async () => {
      const [reqs, orders] = await Promise.all([
        supabase.from("pro_requests").select("status, requested_at, decision_note").eq("user_id", p.id).order("requested_at", { ascending: false }),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", p.id),
      ]);
      if (reqs.error) throw reqs.error;
      return { reqs: reqs.data, orders: orders.count ?? 0 };
    },
  });
  const save = useMutation({
    mutationFn: async () => {
      const v = Number(disc.replace(",", "."));
      if (!(v >= 0 && v <= 100)) throw new Error("O desconto deve estar entre 0 e 100%.");
      const { error } = await supabase.from("profiles").update({ individual_discount_percent: v }).eq("id", p.id);
      if (error) throw new Error("Não foi possível salvar o desconto.");
    },
    onSuccess: () => { toast.success("Desconto individual salvo."); qc.invalidateQueries({ queryKey: ["admin-clients"] }); onDone(); },
    onError: (e) => toast.error((e as Error).message),
  });
  const remove = useMutation({
    mutationFn: () => deleteClient({ data: { userId: p.id } }),
    onSuccess: () => { toast.success("Cliente excluído definitivamente."); qc.invalidateQueries(); onDone(); },
    onError: (e) => toast.error((e as Error).message || "Não foi possível excluir o cliente."),
  });
  const isPro = p.account_type === "profissional" && p.pro_status === "aprovado";
  return (
    <>
      <DialogHeader><DialogTitle className="font-display text-2xl">{p.name || "Cliente"}</DialogTitle></DialogHeader>
      <dl className="grid grid-cols-[130px_1fr] gap-y-2 text-sm">
        <dt className="text-muted-foreground">E-mail</dt><dd className="break-all">{p.email}</dd>
        <dt className="text-muted-foreground">CPF</dt><dd>{p.cpf || "—"}</dd>
        <dt className="text-muted-foreground">Telefone</dt><dd>{p.phone || "—"}</dd>
        <dt className="text-muted-foreground">Nascimento</dt><dd>{p.birth_date ? new Date(p.birth_date + "T12:00").toLocaleDateString("pt-BR") : "—"}</dd>
        <dt className="text-muted-foreground">Cadastro</dt><dd>{fmtDate(p.created_at)}</dd>
        <dt className="text-muted-foreground">Último acesso</dt><dd>{fmtDate(p.last_access_at)}</dd>
        <dt className="text-muted-foreground">Conta</dt><dd>{p.account_type === "profissional" ? "Profissional" : "Comum"} · {p.account_status === "ativa" ? "Ativa" : "Excluída"}</dd>
        <dt className="text-muted-foreground">Profissional</dt><dd>{proLabel[p.pro_status]}</dd>
        <dt className="text-muted-foreground">Pedidos</dt><dd>{extra.isLoading ? "…" : extra.data?.orders ?? "—"}</dd>
      </dl>
      {!!extra.data?.reqs.length && (
        <div className="space-y-1 text-sm"><p className="font-medium">Solicitações profissionais</p>
          {extra.data.reqs.map((r, i) => <p key={i} className="text-muted-foreground">{fmtDate(r.requested_at)} — {proLabel[r.status]}{r.decision_note ? ` (${r.decision_note})` : ""}</p>)}
        </div>
      )}
      {isPro ? (
        <div className="space-y-2 border-t pt-4">
          <FieldRow label="Desconto individual profissional (%)" hint="Aplicado sobre o preço profissional. O cliente vê apenas o preço final.">
            <input className={inputCls} inputMode="decimal" value={disc} onChange={(e) => setDisc(e.target.value)} />
          </FieldRow>
          <Button variant="dark" className="w-full" disabled={save.isPending} onClick={() => save.mutate()}>Salvar desconto</Button>
        </div>
      ) : <p className="border-t pt-4 text-xs text-muted-foreground">Desconto individual disponível apenas para profissionais aprovados.</p>}
      <div className="border-t pt-4">
        <DeleteConfirm label="Excluir cliente" title={`Excluir “${p.name || p.email}”`} pending={remove.isPending} onConfirm={() => remove.mutate()}
          items={["A conta de acesso (login) e o perfil", "Endereços, carrinho, favoritos, avisos de disponibilidade e avaliações",
            "Notificações, solicitações e documentos profissionais", "Todos os pedidos do cliente, com itens e histórico"]} />
      </div>
    </>
  );
}
