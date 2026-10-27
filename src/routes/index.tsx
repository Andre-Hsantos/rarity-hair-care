import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, BadgePercent, Headphones, MessageCircle, Scissors, Sparkles, Truck } from "lucide-react";
import hero from "@/assets/hero.jpg";
import hero2 from "@/assets/hero2.jpg";
import kit from "@/assets/kit.jpg";

type HeroSlide = {
  src: string;
  /** Imagem vertical opcional só para celular (até 639px). Ideal 1080×1350. */
  mobileSrc?: string;
  alt: string;
  eyebrow: string;
  before: string;
  highlight: string;
  after: string;
  text: string;
  primary: { label: string; to: "/produtos" | "/sobre" | "/cadastro" | "/contato" };
  secondary: { label: string; to: "/produtos" | "/sobre" | "/cadastro" | "/contato" };
};

const heroSlides: HeroSlide[] = [
  {
    src: hero,
    alt: "Linha de produtos Rarity com embalagens brancas e tampas douradas",
    eyebrow: "coleções rarity",
    before: "O cuidado que seu cabelo ",
    highlight: "merece",
    after: ".",
    text: "Tratamentos, finalizadores e rotinas completas para fios saudáveis, com brilho e leveza.",
    primary: { label: "Ver produtos", to: "/produtos" },
    secondary: { label: "Conheça a Rarity", to: "/sobre" },
  },
  {
    src: hero2,
    alt: "Produtos Rarity sobre pedra clara com luz natural",
    eyebrow: "rotina completa",
    before: "Brilho e leveza ",
    highlight: "todos os dias",
    after: ".",
    text: "Monte sua rotina com shampoos, máscaras e finalizadores pensados para cada tipo de fio.",
    primary: { label: "Ver produtos", to: "/produtos" },
    secondary: { label: "Fale com a gente", to: "/contato" },
  },
];

function HeroCarousel() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const touchX = useRef<number | null>(null);
  const total = heroSlides.length;
  const go = (d: number) => setI((n) => (n + d + total) % total);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((n) => (n + 1) % total), 6000);
    return () => clearInterval(t);
  }, [i, paused, total]);
  return (
    <section className="container-site pt-6 sm:pt-10">
      <div
        className="group/hero relative overflow-hidden rounded-2xl bg-surface"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => { setPaused(false); setTilt({ x: 0, y: 0 }); }}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          setTilt({ x: (e.clientX - r.left) / r.width - 0.5, y: (e.clientY - r.top) / r.height - 0.5 });
        }}
        onTouchStart={(e) => { touchX.current = e.touches[0]?.clientX ?? null; }}
        onTouchEnd={(e) => {
          if (touchX.current == null) return;
          const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touchX.current = null;
        }}
      >
        {heroSlides.map((s, n) => (
          <picture key={s.src}>
            <source media="(min-width: 640px)" srcSet={s.src} />
            <img
              src={s.mobileSrc ?? s.src}
              alt={s.alt}
              width={1600}
              height={1104}
              aria-hidden={n !== i}
              style={{ transform: `scale(1.04) translate(${tilt.x * -14}px, ${tilt.y * -10}px)` }}
              className={`absolute inset-0 h-full w-full object-cover transition-[opacity,transform] ease-out motion-reduce:!transform-none object-[70%_center] sm:object-right transition-opacity duration-1000 ${n === i ? "opacity-100" : "opacity-0"}`}
            />
          </picture>
        ))}
        <div className="absolute inset-0 hidden bg-gradient-to-r from-background via-background/80 to-transparent sm:block md:via-background/40" />
        <div className="relative grid min-h-[560px] sm:min-h-[440px] md:min-h-[520px]">
          {heroSlides.map((s, n) => (
            <div
              key={s.src}
              aria-hidden={n !== i}
              className={`col-start-1 row-start-1 flex items-stretch px-5 pb-12 pt-8 text-center transition-opacity duration-700 sm:items-center sm:px-12 sm:py-14 sm:text-left lg:px-16 ${n === i ? "opacity-100" : "pointer-events-none opacity-0"}`}
            >
              <div className="mx-auto flex max-w-lg flex-col justify-between sm:mx-0 sm:block">
                <div>
                <p className="eyebrow text-gold-deep">{s.eyebrow}</p>
                {n === 0 ? (
                  <h1 className="mt-3 text-[2.1rem] leading-[1.1] sm:mt-4 sm:text-5xl sm:leading-[1.05] lg:text-6xl">
                    {s.before}<em className="text-gold-metal not-italic">{s.highlight}</em>{s.after}
                  </h1>
                ) : (
                  <h2 className="mt-3 text-[2.1rem] leading-[1.1] sm:mt-4 sm:text-5xl sm:leading-[1.05] lg:text-6xl">
                    {s.before}<em className="text-gold-metal not-italic">{s.highlight}</em>{s.after}
                  </h2>
                )}
                </div>
                <div>
                <p className="mx-auto mt-6 max-w-md text-sm text-muted-foreground max-sm:hidden sm:mx-0 sm:mt-5 sm:text-base">{s.text}</p>
                <div className="mt-6 flex flex-wrap justify-center gap-3 sm:mt-8 sm:justify-start">
                  <Link to={s.primary.to} tabIndex={n === i ? 0 : -1} className={buttonVariants({ variant: "gold", size: "lg" })}>
                    {s.primary.label} <ArrowRight />
                  </Link>
                  <Link to={s.secondary.to} tabIndex={n === i ? 0 : -1} className={`${buttonVariants({ variant: "outlineGold", size: "lg" })} max-sm:hidden`}>
                    {s.secondary.label}
                  </Link>
                </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {[-1, 1].map((d) => (
          <button
            key={d}
            type="button"
            aria-label={d < 0 ? "Imagem anterior" : "Próxima imagem"}
            onClick={() => go(d)}
            className={`absolute top-1/2 z-10 hidden size-11 -translate-y-1/2 place-items-center rounded-full border border-gold/40 bg-card/80 text-foreground opacity-0 shadow-soft backdrop-blur transition-all duration-300 hover:scale-110 hover:bg-gold hover:text-gold-foreground group-hover/hero:opacity-100 sm:grid ${d < 0 ? "left-4" : "right-4"}`}
          >
            {d < 0 ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
          </button>
        ))}
        <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2">
          {heroSlides.map((_, n) => (
            <button
              key={n}
              type="button"
              aria-label={`Imagem ${n + 1}`}
              onClick={() => setI(n)}
              className={`h-1.5 rounded-full transition-all duration-300 ${n === i ? "w-6 bg-gold-deep" : "w-1.5 bg-foreground/25 hover:w-3 hover:bg-gold"}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
import { useHomeSection, type Product } from "@/lib/catalog";
import { ProductCard } from "@/components/site/ProductCard";
import { Testimonials } from "@/components/site/Testimonials";
import { Reveal } from "@/components/site/Reveal";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Rarity Hair Care — Cuidados capilares premium" },
      {
        name: "description",
        content:
          "Shampoos, máscaras, finalizadores e kits Rarity Hair Care. Compra pelo WhatsApp, entrega ou retirada.",
      },
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
  const professional = useHomeSection("professional");
  return (
    <>
      <HeroCarousel />

      <ProductSection eyebrow="Seleção Rarity" title="Produtos em destaque" items={featured} />

      <Reveal><ResellerBanner /></Reveal>

      <ProductSection eyebrow="Favoritos das clientes" title="Produtos mais vendidos" items={bestSellers} />

      <Reveal><KitsBanner /></Reveal>

      <ProductSection eyebrow="Linha para salões" title="Produtos profissionais" items={professional} />

      <Reveal><Testimonials /></Reveal>


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
        <Link
          to="/produtos"
          className="hidden shrink-0 items-center gap-1 text-sm text-foreground/75 hover:text-foreground sm:inline-flex"
        >
          Ver todos <ArrowRight className="size-4" />
        </Link>
      </div>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
        {items.map((p, n) => (
          <Reveal key={p.id} delay={(n % 4) * 90}>
            <ProductCard p={p} />
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function ResellerBanner() {
  const wa = `https://api.whatsapp.com/send?phone=5527997579959&text=${encodeURIComponent("Olá! Sou profissional e tenho interesse em revender os produtos Rarity.")}`;
  const perks = [
    { icon: BadgePercent, t: "Preços exclusivos", d: "Condições especiais para profissionais aprovados." },
    { icon: Scissors, t: "Linha para salões", d: "Produtos pensados para o dia a dia do salão." },
    { icon: MessageCircle, t: "Atendimento direto", d: "Suporte comercial pelo WhatsApp." },
  ];
  return (
    <section className="container-site mt-20">
      <div className="group relative overflow-hidden rounded-2xl border border-gold/30 bg-ink p-8 text-ink-foreground transition-all duration-500 hover:border-gold/60 hover:shadow-gold sm:p-12 lg:p-16">
        <div className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-gold/10 blur-3xl" />
        <div className="relative grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <p className="eyebrow text-gold">Seja um representante</p>
            <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">
              Leve a Rarity para <span className="text-gold-metal">o seu salão</span>.
            </h2>
            <p className="mt-4 max-w-md text-ink-foreground/70">
              Cadastre-se como profissional e tenha acesso a preços e condições exclusivas para cabeleireiros e salões.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/cadastro" className={buttonVariants({ variant: "gold", size: "lg" })}>
                Quero ser um representante <ArrowRight />
              </Link>
              <a
                href={wa}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants({ variant: "outlineLight", size: "lg" })}
              >
                Tirar dúvidas no WhatsApp
              </a>
            </div>
          </div>
          <ul className="grid gap-4">
            {perks.map(({ icon: I, t, d }) => (
              <li key={t} className="flex gap-4 rounded-xl border border-ink-foreground/10 bg-ink-foreground/5 p-5">
                <span className="grid size-11 shrink-0 place-items-center rounded-full border border-gold/40">
                  <I className="size-5 text-gold" strokeWidth={1.5} />
                </span>
                <span>
                  <span className="block font-medium">{t}</span>
                  <span className="text-sm text-ink-foreground/65">{d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function KitsBanner() {
  return (
    <section className="container-site mt-20">
      <div className="group grid overflow-hidden rounded-2xl bg-ink text-ink-foreground transition-shadow duration-500 hover:shadow-gold md:grid-cols-2">
        <div className="flex flex-col justify-center p-8 sm:p-12 lg:p-16">
          <p className="eyebrow text-gold">Kits Rarity</p>
          <h2 className="mt-4 text-4xl leading-tight sm:text-5xl">
            Rotina completa, <span className="text-gold-metal">em um só presente</span>.
          </h2>
          <p className="mt-4 max-w-md text-ink-foreground/70">
            Conteúdo demonstrativo para campanhas, ofertas e seleções especiais da marca.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/produtos" search={{ tipo: "kit" }} className={buttonVariants({ variant: "gold", size: "lg" })}>
              Ver kits
            </Link>
            <Link
              to="/produtos"
              search={{ promo: true }}
              className={buttonVariants({ variant: "outlineLight", size: "lg" })}
            >
              Ofertas selecionadas
            </Link>
          </div>
        </div>
        <img
          src={kit}
          alt="Kit Rarity em caixa preta com detalhes dourados"
          loading="lazy"
          width={1200}
          height={912}
          className="h-full min-h-72 w-full object-cover"
        />
      </div>
    </section>
  );
}
