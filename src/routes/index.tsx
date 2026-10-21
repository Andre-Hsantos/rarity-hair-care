import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Headphones, MessageCircle, Sparkles, Truck } from "lucide-react";
import hero from "@/assets/hero.jpg";
import hero2 from "@/assets/hero2.jpg";
import kit from "@/assets/kit.jpg";

const heroSlides = [
  { src: hero, alt: "Linha de produtos Rarity com embalagens brancas e tampas douradas" },
  { src: hero2, alt: "Produtos Rarity sobre pedra clara com luz natural" },
];

function HeroImages() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % heroSlides.length), 6000);
    return () => clearInterval(t);
  }, [i]);
  return (
    <>
      {heroSlides.map((s, n) => (
        <img
          key={s.src}
          src={s.src}
          alt={s.alt}
          width={1600}
          height={1104}
          aria-hidden={n !== i}
          className={`absolute inset-0 h-full w-full object-cover object-right transition-opacity duration-1000 ${n === i ? "opacity-100" : "opacity-0"}`}
        />
      ))}
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2">
        {heroSlides.map((_, n) => (
          <button
            key={n}
            type="button"
            aria-label={`Imagem ${n + 1}`}
            onClick={() => setI(n)}
            className={`h-1.5 rounded-full transition-all ${n === i ? "w-6 bg-gold-deep" : "w-1.5 bg-foreground/25"}`}
          />
        ))}
      </div>
    </>
  );
}
import { useHomeSection, type Product } from "@/lib/catalog";
import { ProductCard } from "@/components/site/ProductCard";
import { Testimonials } from "@/components/site/Testimonials";
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
      <section className="container-site pt-6 sm:pt-10">
        <div className="relative overflow-hidden rounded-2xl bg-surface">
          <HeroImages />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent md:via-background/40" />
          <div className="relative grid min-h-[440px] items-center px-6 py-14 sm:px-12 md:min-h-[520px] lg:px-16">
            <div className="max-w-lg">
              <p className="eyebrow text-gold-deep">Nova coleção</p>
              <h1 className="mt-4 text-5xl leading-[1.05] sm:text-6xl">
                O cuidado que seu cabelo <em className="text-gold-metal not-italic">merece</em>.
              </h1>
              <p className="mt-5 max-w-md text-base text-muted-foreground">
                Tratamentos, finalizadores e rotinas completas para fios saudáveis, com brilho e leveza.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link to="/produtos" className={buttonVariants({ variant: "gold", size: "lg" })}>
                  Ver produtos <ArrowRight />
                </Link>
                <Link to="/sobre" className={buttonVariants({ variant: "outlineGold", size: "lg" })}>
                  Conheça a Rarity
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ProductSection eyebrow="Seleção Rarity" title="Produtos em destaque" items={featured} />

      <KitsBanner />

      <ProductSection eyebrow="Favoritos das clientes" title="Produtos mais vendidos" items={bestSellers} />

      <Testimonials />

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

function KitsBanner() {
  return (
      <section className="container-site mt-20">
        <div className="grid overflow-hidden rounded-2xl bg-ink text-ink-foreground md:grid-cols-2">
          <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
            <p className="eyebrow text-gold">Kits Rarity</p>
            <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">Rotina completa, <span className="text-gold-metal">em um só presente</span>.</h2>
            <p className="mt-4 max-w-md text-ink-foreground/70">
              Conteúdo demonstrativo para campanhas, ofertas e seleções especiais da marca.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/produtos" search={{ tipo: "kit" }} className={buttonVariants({ variant: "gold", size: "lg" })}>
                Ver kits
              </Link>
              <Link to="/produtos" search={{ promo: true }} className={buttonVariants({ variant: "outlineLight", size: "lg" })}>
                Ofertas selecionadas
              </Link>
            </div>
          </div>
          <img src={kit} alt="Kit Rarity em caixa preta com detalhes dourados" loading="lazy" width={1200} height={912} className="h-full min-h-72 w-full object-cover" />
        </div>
      </section>
  );
}
