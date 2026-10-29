import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";
import { MyNotifications } from "@/components/site/MyNotifications";

export const Route = createFileRoute("/_authenticated/notificacoes")({ staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "Notificações — Rarity Hair Care" },
      { name: "description", content: "Suas notificações da Rarity Hair Care." },
      { property: "og:title", content: "Notificações — Rarity Hair Care" },
      { property: "og:description", content: "Suas notificações da Rarity Hair Care." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Notificações" crumb="Notificações" />
      <div className="container-site mt-10"><MyNotifications /></div>
    </>
  ),
});
