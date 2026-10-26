import { createFileRoute, Link } from "@tanstack/react-router";
import sobreImg from "@/assets/sobre.jpg";
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

function About() {
  return (
    <>
      <PageHeader title="Sobre nós" crumb="Sobre nós" />
      <div className="container-site mt-14 grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="eyebrow text-gold-deep">A Rarity</p>
          <h2 className="mt-3 text-4xl leading-tight sm:text-5xl">Cuidado capilar com identidade própria.</h2>
          <p className="mt-6 leading-relaxed text-muted-foreground">
            Na Rarity Hair Care, acreditamos que a beleza começa na escolha do cuidado certo. Reunimos produtos
            capilares para quem valoriza a saúde dos fios e para profissionais que transformam conhecimento e técnica em
            beleza todos os dias.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Mais do que produtos, buscamos oferecer uma experiência que une praticidade, confiança e atendimento
            próximo, com soluções para diferentes necessidades e condições especiais para profissionais aprovados.
          </p>
          <Link to="/produtos" className={buttonVariants({ variant: "gold", size: "lg", className: "mt-8" })}>
            Conheça os produtos
          </Link>
        </div>
        <img
          src={sobreImg}
          alt="Produtos Rarity"
          loading="lazy"
          className="aspect-[4/3] w-full rounded-2xl object-cover object-right"
        />
      </div>
      <StatsBand />
    </>
  );
}
