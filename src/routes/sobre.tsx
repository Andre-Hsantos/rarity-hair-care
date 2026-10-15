import { createFileRoute, Link } from "@tanstack/react-router";
import hero from "@/assets/hero.jpg";
import { PageHeader } from "@/components/site/PageHeader";
import { StatsBand } from "@/components/site/StatsBand";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre nós — Rarity Hair Care" },
      { name: "description", content: "Conheça a Rarity Hair Care e seus valores." },
      { property: "og:title", content: "Sobre nós — Rarity Hair Care" },
      { property: "og:description", content: "Conheça a Rarity Hair Care." },
    ],
  }),
  component: About,
});
