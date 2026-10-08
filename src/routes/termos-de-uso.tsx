import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";

export const Route = createFileRoute("/termos-de-uso")({
  head: () => ({
    meta: [
      { title: "Termos de Uso — Rarity Hair Care" },
      { name: "description", content: "Termos de Uso da Rarity Hair Care." },
      { property: "og:title", content: "Termos de Uso — Rarity Hair Care" },
      { property: "og:description", content: "Termos de Uso da Rarity Hair Care." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Termos de Uso" crumb="Termos de Uso" />
      <div className="container-site mt-10 max-w-3xl space-y-4 leading-relaxed text-foreground/85">
        <p className="rounded-lg border border-dashed bg-surface p-5 text-sm text-muted-foreground">
          Conteúdo definitivo em elaboração. O texto oficial desta página ainda será publicado pela Rarity Hair Care.
        </p>
      </div>
    </>
  ),
});
