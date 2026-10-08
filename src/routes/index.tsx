import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Headphones, MessageCircle, Sparkles, Truck } from "lucide-react";
import { HomeCarousel } from "@/components/site/HomeCarousel";
import { useHomeSection, type Product } from "@/lib/catalog";
import { ProductCard } from "@/components/site/ProductCard";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rarity Hair Care — Cuidados capilares premium" },
      { name: "description", content: "Shampoos, máscaras, finalizadores e kits Rarity Hair Care. Compra pelo WhatsApp, entrega ou retirada." },
      { property: "og:title", content: "Rarity Hair Care — Cuidados capilares premium" },
      { property: "og:description", content: "Conheça a linha Rarity de cuidados capilares." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const benefits = [
  { icon: Sparkles, title: "Produtos selecionados", text: "Linha pensada para cada tipo de cabelo." },
  { icon: Headphones, title: "Atendimento especializado", text: "Orientação para escolher o cuidado certo." },
  { icon: MessageCircle, title: "Compra pelo WhatsApp", text: "Finalize seu pedido com praticidade." },
  { icon: Truck, title: "Entrega ou retirada", text: "Escolha a opção mais conveniente." },
];

function Index() {
  const featured = useHomeSection("featured");
  const bestSellers = useHomeSection("best_sellers");
  return (
    <>
      <HomeCarousel />

      <ProductSection eyebrow="Seleção Rarity" title="Produtos em destaque" items={featured} />

      <ProductSection eyebrow="Favoritos das clientes" title="Produtos mais vendidos" items={bestSellers} />

      <section className="container-site mt-20">
        <div className="grid gap-px overflow-hidden rounded-2xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {benefits.map(({ icon: I, title, text }) => (
            <div key={title} className="bg-card p-6 sm:p-8">
              <I className="size-6 text-gold-deep" strokeWidth={1.5} />
              <h3 className="mt-4 text-xl">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}

function ProductSection({ eyebrow, title, items }: { eyebrow: string; title: string; items: Product[] }) {
  if (!items.length) return null;
  return (
    <section className="container-site mt-20">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-gold-deep">{eyebrow}</p>
          <h2 className="mt-2 text-4xl">{title}</h2>
        </div>
        <Link to="/produtos" className="hidden shrink-0 items-center gap-1 text-sm text-foreground/75 hover:text-foreground sm:inline-flex">
          Ver todos <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
        {items.map((p) => <ProductCard key={p.id} p={p} />)}
      </div>
    </section>
  );
}

