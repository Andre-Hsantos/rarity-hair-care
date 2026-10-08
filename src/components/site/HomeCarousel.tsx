import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import kit from "@/assets/kit.jpg";
import { supabase } from "@/integrations/supabase/client";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const CAROUSEL_PLACEMENT = "home_kits";
const AUTOPLAY_MS = 6000;

type Slide = { id: string; title: string | null; subtitle: string | null; image_url: string | null; link: string | null; button_label: string | null };

/** Single banner slot at the top of the Home: active slides in admin order; built-in Kits banner when none. */
export function HomeCarousel() {
  const q = useQuery({
    queryKey: ["home-banners"],
    queryFn: async () => {
      const { data, error } = await supabase.from("banners").select("id, title, subtitle, image_url, link, button_label")
        .eq("placement", CAROUSEL_PLACEMENT).eq("status", "ativo").order("display_order").order("created_at");
      if (error) throw error;
      return data as Slide[];
    },
  });
  if (!q.isFetched) return <section className="container-site pt-6 sm:pt-10"><div className="min-h-[440px] rounded-2xl bg-surface md:min-h-[520px]" /></section>;
  const slides = q.data ?? [];
  return (
    <section className="container-site pt-6 sm:pt-10">
      {slides.length === 0 ? <DefaultSlide /> : slides.length === 1 ? <SlideView s={slides[0]!} /> : <Carousel slides={slides} />}
    </section>
  );
}

function Carousel({ slides }: { slides: Slide[] }) {
  const [ref, api] = useEmblaCarousel({ loop: true, duration: 30 });
  const [sel, setSel] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (!api) return;
    const on = () => setSel(api.selectedScrollSnap());
    on();
    api.on("select", on);
    api.on("pointerDown", () => setPaused(true));
    return () => { api.off("select", on); };
  }, [api]);
  useEffect(() => {
    if (!api || paused) return;
    const t = setInterval(() => api.scrollNext(), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [api, paused, sel]);
  const go = useCallback((i: number) => api?.scrollTo(i), [api]);
  return (
    <div className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carrossel">
      <div ref={ref} className="overflow-hidden rounded-2xl">
        <div className="flex">
          {slides.map((s, i) => (
            <div key={s.id} className="min-w-0 shrink-0 grow-0 basis-full" aria-roledescription="slide" aria-label={`${i + 1} de ${slides.length}`}>
              <SlideView s={s} />
            </div>
          ))}
        </div>
      </div>
      <button aria-label="Slide anterior" onClick={() => api?.scrollPrev()} className="absolute left-2 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-background/80 text-foreground shadow-card hover:bg-background md:grid"><ChevronLeft className="size-5" /></button>
      <button aria-label="Próximo slide" onClick={() => api?.scrollNext()} className="absolute right-2 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-background/80 text-foreground shadow-card hover:bg-background md:grid"><ChevronRight className="size-5" /></button>
      <div className="mt-3 flex justify-center gap-2">
        {slides.map((s, i) => (
          <button key={s.id} aria-label={`Ir para o slide ${i + 1}`} aria-current={i === sel} onClick={() => go(i)} className="grid size-6 place-items-center">
            <span className={cn("block h-1.5 rounded-full transition-all", i === sel ? "w-6 bg-gold-deep" : "w-1.5 bg-muted-foreground/40")} />
          </button>
        ))}
      </div>
    </div>
  );
}

function SlideView({ s }: { s: Slide }) {
  return (
    <div className="grid overflow-hidden rounded-2xl bg-ink text-ink-foreground md:min-h-[460px] md:grid-cols-2">
      <div className="order-2 flex flex-col justify-center p-6 sm:p-12 md:order-1 lg:p-16">
        {s.title && <h2 className="text-3xl leading-tight sm:text-5xl">{s.title}</h2>}
        {s.subtitle && <p className="mt-4 max-w-md whitespace-pre-line text-ink-foreground/70">{s.subtitle}</p>}
        {s.link && (
          <div className="mt-6 sm:mt-8">
            <a href={s.link} {...(s.link.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})} className={buttonVariants({ variant: "gold", size: "lg" })}>{s.button_label || "Ver mais"}</a>
          </div>
        )}
      </div>
      <img src={s.image_url || kit} alt={s.title || "Rarity Hair Care"} draggable={false} className="order-1 h-56 w-full object-cover sm:h-72 md:order-2 md:h-full" />
    </div>
  );
}

function DefaultSlide() {
  return (
    <div className="grid overflow-hidden rounded-2xl bg-ink text-ink-foreground md:min-h-[460px] md:grid-cols-2">
      <div className="order-2 flex flex-col justify-center p-6 sm:p-12 md:order-1 lg:p-16">
        <p className="eyebrow text-gold">Kits Rarity</p>
        <h1 className="mt-4 text-3xl leading-tight sm:text-5xl">Rotina completa, <span className="text-gold-metal">em um só presente</span>.</h1>
        <div className="mt-6 flex flex-wrap gap-3 sm:mt-8">
          <Link to="/produtos" search={{ tipo: "kit" }} className={buttonVariants({ variant: "gold", size: "lg" })}>Ver kits</Link>
          <Link to="/produtos" search={{ promo: true }} className={buttonVariants({ variant: "outlineLight", size: "lg" })}>Ofertas selecionadas</Link>
        </div>
      </div>
      <img src={kit} alt="Kit Rarity em caixa preta com detalhes dourados" width={1200} height={912} className="order-1 h-56 w-full object-cover sm:h-72 md:order-2 md:h-full" />
    </div>
  );
}
