import { useState } from "react";
import { useMarkRead, useMyNotifications } from "@/lib/notifications";

export function MyNotifications() {
  const q = useMyNotifications();
  const mark = useMarkRead();
  const list = q.data ?? [];
  const unread = list.filter((n) => !n.read_at);
  const [openId, setOpenId] = useState<string | null>(null);
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 className="text-3xl">Central de Notificações:</h2>
        {unread.length > 0 && <button onClick={() => mark.mutate(unread.map((n) => n.id))} className="text-sm text-gold-deep hover:underline">Marcar todas como lidas</button>}
      </div>
      {q.isLoading ? <p className="mt-6 text-sm text-muted-foreground">Carregando…</p> : !list.length ? (
        <p className="mt-4 text-muted-foreground">Você ainda não tem notificações.</p>
      ) : (
        <ul className="mt-6 space-y-3">
          {list.map((n) => {
            const isOpen = openId === n.id;
            return (
              <li key={n.id} className={`rounded-lg border text-sm ${n.read_at ? "" : "bg-gold/5"}`}>
                <button className="flex w-full gap-3 p-4 text-left" aria-expanded={isOpen}
                  onClick={() => { setOpenId(isOpen ? null : n.id); if (!n.read_at) mark.mutate([n.id]); }}>
                  <span className={`mt-1.5 size-2 shrink-0 rounded-full ${n.read_at ? "bg-border" : "bg-gold"}`} aria-label={n.read_at ? "Lida" : "Não lida"} />
                  <span className="min-w-0 flex-1">
                    <span className={`block ${n.read_at ? "" : "font-medium"}`}>{n.title}</span>
                    <span className="text-xs text-muted-foreground">{new Date(n.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}{n.read_at ? "" : " · Não lida"}</span>
                    {isOpen && n.body && <span className="mt-2 block whitespace-pre-line text-foreground/80">{n.body}</span>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
