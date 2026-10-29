import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/site/PageHeader";

export const Route = createFileRoute("/trocas-e-devolucoes")({ staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Trocas e devoluções — Rarity Hair Care" },
      { name: "description", content: "Trocas, devoluções e solicitações relacionadas a pedidos na Rarity Hair Care." },
      { property: "og:title", content: "Trocas e devoluções — Rarity Hair Care" },
      { property: "og:description", content: "Trocas, devoluções e solicitações relacionadas a pedidos na Rarity Hair Care." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => (
    <>
      <PageHeader title="Trocas e devoluções" crumb="Trocas e devoluções" />
      <div className="container-site mt-10 max-w-3xl space-y-4 leading-relaxed text-foreground/85">
        <h2 className="text-2xl">Trocas, devoluções e solicitações relacionadas a pedidos</h2>
        <p>
          O cliente deve entrar em contato pelo WhatsApp comercial{" "}
          <a href="https://wa.me/5527997579959" target="_blank" rel="noreferrer" className="text-gold-deep underline">(27) 99757-9959</a>{" "}
          antes de enviar qualquer produto. Cada caso será analisado individualmente, considerando as circunstâncias, o estado do produto e a legislação aplicável. A análise não restringe os direitos assegurados ao consumidor pela legislação.
        </p>
      </div>
    </>
  ),
});
