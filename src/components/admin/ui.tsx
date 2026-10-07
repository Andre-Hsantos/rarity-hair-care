import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const inputCls =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/25 disabled:opacity-60";
export const areaCls =
  "min-h-20 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/25";

export function PageHead({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-3xl sm:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function FieldRow({ label, children, hint, className }: { label: string; children: ReactNode; hint?: string; className?: string }) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Loading() {
  return (
    <div className="flex items-center gap-2 py-10 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> Carregando…
    </div>
  );
}

export function ErrorBox({ message = "Não foi possível carregar os dados." }: { message?: string }) {
  return <p className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{message}</p>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">{children}</p>;
}

const tones: Record<string, string> = {
  ok: "bg-ink/10 text-foreground border-ink/25",
  warn: "bg-gold/15 text-gold-deep border-gold/30",
  off: "bg-muted text-muted-foreground border-border",
  bad: "bg-destructive/10 text-destructive border-destructive/20",
};
export function Pill({ tone = "off", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}

export const audienceLabel = { todos: "Todos", comuns: "Clientes avulsos", profissionais: "Profissionais" } as const;

export function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  return new Date(d.getTime() - off * 60000).toISOString().slice(0, 16);
}
export function fromLocalInput(v: string) {
  return v ? new Date(v).toISOString() : null;
}
export function fmtDate(iso: string | null) {
  return iso ? new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "—";
}
export const brl = (n: number | null | undefined) =>
  n == null ? "—" : Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
