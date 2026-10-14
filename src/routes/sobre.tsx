import { createFileRoute, Link } from "@tanstack/react-router";
import hero from "@/assets/hero.jpg";
import { PageHeader } from "@/components/site/PageHeader";
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

// Valores demonstrativos — altere aqui os números e textos.
const values = [
  ["+5.000", "Clientes satisfeitos"],
  ["10 anos", "De empresa"],
  ["100%", "Produtos de qualidade"],
];

function About() {
  return (
    <>
      <PageHeader title="Sobre nós" crumb="Sobre nós" />
      <div className="container-site mt-14 grid items-center gap-12 lg:grid-cols-2">
        <div>
          <p className="eyebrow text-gold-deep">A Rarity</p>
          <h2 className="mt-3 text-4xl leading-tight sm:text-5xl">Cuidado capilar com identidade própria.</h2>
          <p className="mt-6 leading-relaxed text-muted-foreground">
            Este é um texto institucional demonstrativo, que será substituído pela história oficial da marca. Aqui poderá ser apresentada a origem da Rarity, sua missão e a forma como seleciona cada produto.
          </p>
          <p className="mt-4 leading-relaxed text-muted-foreground">
            Parágrafo de apoio genérico para validar tipografia, ritmo de leitura e hierarquia visual da página.
          </p>
          <Link to="/produtos" className={buttonVariants({ variant: "gold", size: "lg", className: "mt-8" })}>Conheça os produtos</Link>
        </div>
        <img src={hero} alt="Produtos Rarity" loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover object-right" />
      </div>
      <div className="container-site mt-20 grid gap-6 sm:grid-cols-3">
        {values.map(([t, d]) => (
          <div key={t} className="rounded-xl border bg-card p-8">
            <div className="h-px w-10 bg-gold-metal" />
            <h3 className="mt-5 text-4xl">{t}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{d}</p>
          </div>
        ))}
      </div>
    </>
  );
}
