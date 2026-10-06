import { Construction } from "lucide-react";

export function AdminPlaceholder({ title, description, next }: { title: string; description: string; next: string[] }) {
  return (
    <div>
      <h1 className="text-3xl sm:text-4xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>
      <div className="mt-8 rounded-lg border border-dashed bg-card p-6">
        <div className="flex items-center gap-2 text-sm font-medium text-gold-deep">
          <Construction className="size-4" /> Módulo em estrutura — ainda não conectado aos dados
        </div>
        <p className="mt-3 text-sm text-muted-foreground">Próximas implementações previstas:</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-foreground/80">
          {next.map((n) => <li key={n}>{n}</li>)}
        </ul>
      </div>
    </div>
  );
}
