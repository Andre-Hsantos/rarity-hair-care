import type { InputHTMLAttributes } from "react";

export function Field({ label, id, hint, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; id: string; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">{label}</label>
      <input
        id={id}
        {...props}
        className="h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-gold focus:ring-2 focus:ring-gold/25 user-invalid:border-destructive"
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="container-site flex justify-center py-14 sm:py-20">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-card sm:p-10">
        <div className="mx-auto mb-6 h-px w-12 bg-gold-metal" />
        <h1 className="text-center text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-center text-sm text-muted-foreground">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </div>
  );
}
