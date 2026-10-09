import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Search } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { areaCls, Empty, ErrorBox, fmtDate, inputCls, Loading, PageHead, Pill } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/profissionais")({ component: Professionals });

type Status = "em_analise" | "aprovado" | "rejeitado";
const statusLabel: Record<Status, string> = {
  em_analise: "Em análise",
  aprovado: "Aprovados",
  rejeitado: "Rejeitadas",
};
const proofLabel = { cnpj: "CNPJ", mei: "MEI", certificado: "Certificado" } as const;

function useRequests() {
  return useQuery({
    queryKey: ["admin-pro-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pro_requests")
        .select(
          "*, client:profiles!pro_requests_user_id_fkey(id,name,email,phone,cpf,pro_status,account_type,created_at)",
        )
        .order("requested_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}
type Req = NonNullable<ReturnType<typeof useRequests>["data"]>[number];

function Professionals() {
  const { data, isLoading, isError } = useRequests();
  const [tab, setTab] = useState<Status>("em_analise");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Req | null>(null);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (data ?? []).filter(
      (r) =>
        r.status === tab &&
        (!s || [r.client?.name, r.client?.email, r.client?.phone].some((v) => v?.toLowerCase().includes(s))),
    );
  }, [data, tab, q]);

  return (
    <div>
      <PageHead
        title="Profissionais"
        description="Análise das solicitações de conta profissional. Documentos ficam em área privada e abrem por link temporário."
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(Object.keys(statusLabel) as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => setTab(s)}
            className={`rounded-md px-3 py-2 text-sm transition ${tab === s ? "bg-ink text-ink-foreground" : "hover:bg-accent"}`}
          >
            {statusLabel[s]} <span className="opacity-70">({(data ?? []).filter((r) => r.status === s).length})</span>
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            className={`${inputCls} pl-9`}
            placeholder="Buscar nome, e-mail, telefone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>
      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorBox />
      ) : list.length === 0 ? (
        <Empty>Nenhuma solicitação nesta situação.</Empty>
      ) : (
        <div className="divide-y rounded-lg border">
          {list.map((r) => (
            <button
              key={r.id}
              onClick={() => setOpen(r)}
              className="flex w-full flex-wrap items-center justify-between gap-2 p-4 text-left transition hover:bg-accent/50"
            >
              <span>
                <span className="block font-medium">{r.client?.name || "Sem nome"}</span>
                <span className="text-sm text-muted-foreground">
                  {r.client?.email} · {proofLabel[r.proof_type]}
                </span>
              </span>
              <span className="text-xs text-muted-foreground">Enviada em {fmtDate(r.requested_at)}</span>
            </button>
          ))}
        </div>
      )}
      <Dialog open={!!open} onOpenChange={(o) => !o && setOpen(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          {open && <RequestDetail req={open} onDone={() => setOpen(null)} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RequestDetail({ req, onDone }: { req: Req; onDone: () => void }) {
  const qc = useQueryClient();
  const [note, setNote] = useState("");
  const c = req.client;

  const openDoc = async () => {
    const { data, error } = await supabase.storage.from("pro-documents").createSignedUrl(req.document_path, 120);
    if (error || !data) {
      toast.error("Não foi possível abrir o documento.");
      return;
    }
    window.open(data.signedUrl, "_blank", "noopener");
  };

  const decide = useMutation({
    mutationFn: async (approve: boolean) => {
      if (!approve && !note.trim()) throw new Error("Informe o motivo da rejeição.");
      const { error } = await supabase.rpc("decide_pro_request", {
        _request_id: req.id,
        _approve: approve,
        _note: note,
      });
      if (error) throw new Error(error.message);
    },
    onSuccess: (_d, approve) => {
      toast.success(
        approve ? "Solicitação aprovada. Cliente notificado." : "Solicitação rejeitada. Cliente notificado.",
      );
      qc.invalidateQueries({ queryKey: ["admin-pro-requests"] });
      qc.invalidateQueries({ queryKey: ["admin-clients"] });
      qc.invalidateQueries({ queryKey: ["admin-overview"] });
      onDone();
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display text-2xl">{c?.name || "Cliente"}</DialogTitle>
      </DialogHeader>
      <dl className="grid grid-cols-[120px_1fr] gap-y-2 text-sm">
        <dt className="text-muted-foreground">E-mail</dt>
        <dd className="break-all">{c?.email}</dd>
        <dt className="text-muted-foreground">Telefone</dt>
        <dd>{c?.phone || "—"}</dd>
        <dt className="text-muted-foreground">CPF</dt>
        <dd>{c?.cpf || "—"}</dd>
        <dt className="text-muted-foreground">Cliente desde</dt>
        <dd>{fmtDate(c?.created_at ?? null)}</dd>
        <dt className="text-muted-foreground">Comprovante</dt>
        <dd>
          {proofLabel[req.proof_type]}
          {req.proof_number
            ? ` · ${req.proof_number.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5")}`
            : ""}
        </dd>
        <dt className="text-muted-foreground">Enviada em</dt>
        <dd>{fmtDate(req.requested_at)}</dd>
        <dt className="text-muted-foreground">Situação</dt>
        <dd>
          <Pill tone={req.status === "aprovado" ? "ok" : req.status === "rejeitado" ? "bad" : "warn"}>
            {statusLabel[req.status]}
          </Pill>
        </dd>
        {req.decided_at && (
          <>
            <dt className="text-muted-foreground">Decidida em</dt>
            <dd>{fmtDate(req.decided_at)}</dd>
          </>
        )}
        {req.decision_note && (
          <>
            <dt className="text-muted-foreground">Observação</dt>
            <dd>{req.decision_note}</dd>
          </>
        )}
      </dl>
      {!req.proof_number && (
        <Button variant="outline" onClick={openDoc} className="mt-2 w-full">
          <FileText className="size-4" /> Ver documento (link temporário)
        </Button>
      )}
      {req.status === "em_analise" && (
        <div className="mt-2 space-y-3 border-t pt-4">
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Observação / motivo (obrigatório para rejeitar)</span>
            <textarea className={areaCls} value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" disabled={decide.isPending} onClick={() => decide.mutate(false)}>
              Rejeitar
            </Button>
            <Button variant="dark" disabled={decide.isPending} onClick={() => decide.mutate(true)}>
              Aprovar
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
