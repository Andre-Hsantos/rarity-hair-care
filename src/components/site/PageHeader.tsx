import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";

export function PageHeader({ title, crumb, subtitle }: { title: string; crumb: string; subtitle?: string }) {
  return (
    <div className="border-b bg-surface">
      <div className="container-site py-10 sm:py-14">
        <nav aria-label="Você está em" className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Início</Link>
          <ChevronRight className="size-3" />
          <span className="text-foreground">{crumb}</span>
        </nav>
        <h1 className="mt-3 text-4xl sm:text-5xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-xl text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
