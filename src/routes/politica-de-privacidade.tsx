import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";

export const Route = createFileRoute("/politica-de-privacidade")({
  head: () => ({
    meta: [
      { title: "Política de Privacidade — Rarity Hair Care" },
      { name: "description", content: "Política de Privacidade da Rarity Hair Care." },
      { property: "og:title", content: "Política de Privacidade — Rarity Hair Care" },
      { property: "og:description", content: "Política de Privacidade da Rarity Hair Care." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Política de Privacidade" crumb="Política de Privacidade" />
      <div className="container-site mt-10 max-w-3xl space-y-4 leading-relaxed text-foreground/85">
        <p className="rounded-lg border border-dashed bg-surface p-5 text-sm text-muted-foreground">
          Conteúdo definitivo em elaboração. O texto oficial desta página ainda será publicado pela Rarity Hair Care.
        </p>
      </div>
    </>
  ),
});
