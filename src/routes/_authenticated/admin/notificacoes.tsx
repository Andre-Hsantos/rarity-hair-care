import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { areaCls, Empty, ErrorBox, FieldRow, fmtDate, inputCls, Loading, PageHead } from "@/components/admin/ui";

export const Route = createFileRoute("/_authenticated/admin/notificacoes")({ component: AdminNotifications });

function AdminNotifications() {
  const qc = useQueryClient();
  const clients = useQuery({
    queryKey: ["admin-notify-clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("id, name, email").eq("account_status", "ativa").order("name");
      if (error) throw error;
      return data;
    },
  });
  const sent = useQuery({
    queryKey: ["admin-notifications"],
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("id, title, created_at, read_at, profiles(name, email)").order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return data;
    },
  });
  const [q, setQ] = useState("");
  const [to, setTo] = useState<string[]>([]);
  const [mode, setMode] = useState<"select" | "todos" | "comuns" | "profissionais">("select");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const byId = useMemo(() => new Map((clients.data ?? []).map((c) => [c.id, c])), [clients.data]);
  const matches = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return [];
    return (clients.data ?? []).filter((c) => !to.includes(c.id) && (c.name.toLowerCase().includes(s) || c.email.toLowerCase().includes(s))).slice(0, 8);
  }, [clients.data, q, to]);

  const send = useMutation({
    mutationFn: async () => {
      const { data, error } = mode === "select"
        ? await supabase.rpc("admin_send_notification", { _user_ids: to, _title: title, _body: body })
        : await supabase.rpc("admin_send_notification_audience", { _audience: mode, _title: title, _body: body });
      if (error) throw new Error(error.message);
      return data as number;
    },
    onSuccess: (n) => {
      toast.success(`Notificação enviada para ${n} cliente(s).`);
      setTo([]); setTitle(""); setBody("");
      qc.invalidateQueries({ queryKey: ["admin-notifications"] });
    },
    onError: (e) => toast.error((e as Error).message),
  });

  return (
    <div>
      <PageHead title="Notificações" description="Comunicados da loja para clientes. O cliente vê a mensagem na área de notificações da conta; não há resposta pelo site." />
      <form className="grid gap-4 rounded-lg border p-5" onSubmit={(e) => { e.preventDefault(); send.mutate(); }}>
        <FieldRow label="Público">
          <div className="flex flex-wrap gap-2" role="radiogroup">
            {([["comuns", "Clientes comuns"], ["profissionais", "Profissionais"], ["todos", "Todos"], ["select", "Clientes específicos"]] as const).map(([k, l]) => (
              <label key={k} className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm ${mode === k ? "border-gold bg-gold/10" : ""}`}>
                <input type="radio" name="aud" className="accent-[var(--gold-deep)]" checked={mode === k} onChange={() => setMode(k)} /> {l}
              </label>
            ))}
          </div>
        </FieldRow>
        {mode === "select" && <FieldRow label="Destinatário(s)">
          <div className="space-y-2">
            {!!to.length && (
              <div className="flex flex-wrap gap-2">
                {to.map((id) => (
                  <span key={id} className="inline-flex items-center gap-1 rounded-full border bg-surface px-3 py-1 text-xs">
                    {byId.get(id)?.name || byId.get(id)?.email}
                    <button type="button" aria-label="Remover destinatário" onClick={() => setTo(to.filter((x) => x !== id))}><X className="size-3" /></button>
                  </span>
                ))}
              </div>
            )}
            <div className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input className={`${inputCls} pl-9`} placeholder="Buscar cliente por nome ou e-mail" value={q} onChange={(e) => setQ(e.target.value)} /></div>
            {!!matches.length && (
              <div className="divide-y rounded-md border">
                {matches.map((c) => (
                  <button type="button" key={c.id} onClick={() => { setTo([...to, c.id]); setQ(""); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-accent/50">
                    {c.name || "Sem nome"} <span className="text-muted-foreground">· {c.email}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </FieldRow>}
        <FieldRow label="Título"><input className={inputCls} maxLength={150} value={title} onChange={(e) => setTitle(e.target.value)} required /></FieldRow>
        <FieldRow label="Mensagem"><textarea className={areaCls} maxLength={2000} value={body} onChange={(e) => setBody(e.target.value)} required /></FieldRow>
        <Button variant="dark" disabled={send.isPending || (mode === "select" && !to.length)}>{send.isPending ? "Enviando…" : "Enviar notificação"}</Button>
      </form>

      <h2 className="mb-3 mt-10 text-2xl">Enviadas recentemente</h2>
      {sent.isLoading ? <Loading /> : sent.isError ? <ErrorBox /> : !sent.data?.length ? <Empty>Nenhuma notificação enviada.</Empty> : (
        <div className="divide-y rounded-lg border">
          {sent.data.map((n) => {
            const p = n.profiles as { name: string; email: string } | null;
            return (
              <div key={n.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <span className="min-w-0 flex-1"><span className="block font-medium">{n.title}</span><span className="text-xs text-muted-foreground">{p?.name || p?.email || "—"} · {fmtDate(n.created_at)}</span></span>
                <span className="text-xs text-muted-foreground">{n.read_at ? "Lida" : "Não lida"}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
