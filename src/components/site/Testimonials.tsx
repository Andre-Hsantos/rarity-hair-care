import { useEffect, useState } from "react";
import { Star } from "lucide-react";

const testimonials = [
  {
    name: "Joelma Chaves",
    salon: "Salão Joelma",
    rating: 5,
    text: "Atendimento perfeito em tudo! Conseguem explicar sobre os produtos e, sempre que preciso, estão prontos para me ajudar e tirar dúvidas. Produtos nota 10 em rendimento, cheirinho maravilhoso e as clientes elogiam sempre!",
  },
  {
    name: "Patrícia Souza",
    salon: "Espaço Bella Fios",
    rating: 5,
    text: "Atendimento excelente e entrega rápida. A máscara de reconstrução virou queridinha das clientes.",
  },
  {
    name: "Camila Rocha",
    salon: "Camila Rocha Beauty",
    rating: 4,
    text: "Ótimo rendimento e resultado profissional. Uso diariamente nas escovas e finalizações.",
  },
  {
    name: "Fernanda Lima",
    salon: "Salão Raízes",
    rating: 5,
    text: "Qualidade impecável. Compro há anos e nunca tive problema com nenhum pedido.",
  },
  {
    name: "Renata Alves",
    salon: "Ateliê do Cabelo",
    rating: 4,
    text: "Os kits são perfeitos para revenda. Minhas clientes sempre voltam pedindo mais.",
  },
];

function Stars({ value }: { value: number }) {
  return (
    <div className="flex justify-center gap-1" aria-label={`${value} de 5 estrelas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`size-5 ${i < value ? "fill-gold-deep text-gold-deep" : "text-border"}`}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export function Testimonials() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % testimonials.length), 5000);
    return () => clearInterval(t);
  }, [i]);

  return (
    <section className="container-site mt-20">
      <div className="text-center">
        <p className="eyebrow text-gold-deep">Quem usa, recomenda</p>
        <h2 className="mt-2 text-3xl sm:text-4xl">O que dizem as profissionais</h2>
      </div>
      <div className="relative mx-auto mt-10 max-w-2xl overflow-hidden rounded-2xl border bg-card">
        <div
          className="flex transition-transform duration-700 ease-in-out"
          style={{ transform: `translateX(-${i * 100}%)` }}
        >
          {testimonials.map((t) => (
            <figure key={t.name} className="w-full shrink-0 px-6 py-10 text-center sm:px-12">
              <Stars value={t.rating} />
              <blockquote className="mt-5 text-lg leading-relaxed text-foreground">“{t.text}”</blockquote>
              <figcaption className="mt-6">
                <p className="font-medium">{t.name}</p>
                <p className="text-sm text-muted-foreground">{t.salon}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
      <div className="mt-5 flex justify-center gap-2">
        {testimonials.map((_, n) => (
          <button
            key={n}
            type="button"
            aria-label={`Depoimento ${n + 1}`}
            onClick={() => setI(n)}
            className={`h-1.5 rounded-full transition-all ${n === i ? "w-6 bg-gold-deep" : "w-1.5 bg-foreground/25"}`}
          />
        ))}
      </div>
    </section>
  );
}
