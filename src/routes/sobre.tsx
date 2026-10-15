```tsx
import { createFileRoute, Link } from "@tanstack/react-router";
import hero from "@/assets/hero.jpg";
import { PageHeader } from "@/components/site/PageHeader";
import { StatsBand } from "@/components/site/StatsBand";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre nós — Rarity Hair Care" },
      {
        name: "description",
        content: "Conheça a Rarity Hair Care e nossa proposta de cuidado capilar.",
      },
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

          <h2 className="mt-3 text-4xl leading-tight sm:text-5xl">
            Cuidado capilar com identidade própria.
          </h2>

          <p className="mt-6 leading-relaxed text-muted-foreground">
            Na Rarity Hair Care, acreditamos que a beleza começa na escolha
            do cuidado certo. Reunimos produtos capilares para quem valoriza
            a saúde dos fios e para profissionais que fazem da beleza parte
            do seu trabalho.
          </p>

          <p className="mt-4 leading-relaxed text-muted-foreground">
            Buscamos oferecer uma experiência que une praticidade, confiança
            e atendimento próximo, com soluções para diferentes necessidades
            e condições especiais para profissionais com cadastro aprovado.
          </p>

          <p className="mt-5 font-medium text-foreground">
            Rarity Hair Care. Sua beleza, seu cuidado, sua raridade.
          </p>

          <Link
            to="/produtos"
            className={buttonVariants({
              variant: "gold",
              size: "lg",
              className: "mt-8",
            })}
          >
            Conheça os produtos
          </Link>
        </div>

        <img
          src={hero}
          alt="Produtos de cuidado capilar"
          loading="lazy"
          className="aspect-[4/3] w-full rounded-2xl object-cover object-right"
        />
      </div>

      <StatsBand />
    </>
  );
}
```;
