import { createFileRoute } from "@tanstack/react-router";
import { Clock, Instagram, MapPin, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/site/PageHeader";
import { Field } from "@/components/site/Field";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contato")({ staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "Contato — Rarity Hair Care" },
      { name: "description", content: "Fale com a Rarity Hair Care pelo WhatsApp, telefone ou formulário." },
      { property: "og:title", content: "Contato — Rarity Hair Care" },
      { property: "og:description", content: "Fale com a Rarity Hair Care." },
    ],
  }),
  component: Contact,
});

const info: { icon: typeof Phone; label: string; value: string; href?: string }[] = [
  { icon: MessageCircle, label: "WhatsApp", value: "(27) 99757-9959", href: "https://api.whatsapp.com/send?phone=5527997579959" },
  {
    icon: MapPin,
    label: "Endereço",
    value: "R. São Paulo, 43 - Jockey de Itaparica, Vila Velha - ES",
    href: "https://www.google.com/maps/search/?api=1&query=R.+S%C3%A3o+Paulo,+43+-+Jockey+de+Itaparica,+Vila+Velha+-+ES",
  },
  { icon: Clock, label: "Horário", value: "Segunda a Sexta\n08:00 às 17:00" },
  { icon: Instagram, label: "Redes sociais", value: "@rarityprofissionaloficial", href: "https://www.instagram.com/rarityprofissionaloficial/" },
];

function Contact() {
  return (
    <>
      <PageHeader
        title="Contato"
        crumb="Contato"
        subtitle="Estamos à disposição para ajudar."
      />
      <div className="container-site mt-12 grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <ul className="grid gap-3 sm:grid-cols-2">
            {info.map(({ icon: I, label, value, href }) => {
              const body = (
                <>
                  <I className="size-5 shrink-0 text-gold-deep" strokeWidth={1.5} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{label}</p>
                    <p className="whitespace-pre-line text-sm text-muted-foreground">{value}</p>
                  </div>
                </>
              );
              return (
                <li key={label}>
                  {href ? (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="flex h-full gap-4 rounded-xl border bg-card p-5 transition hover:border-gold hover:shadow-soft">
                      {body}
                    </a>
                  ) : (
                    <div className="flex h-full gap-4 rounded-xl border bg-card p-5">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
          <iframe
            title="Mapa da loja"
            src="https://www.google.com/maps?q=R.+S%C3%A3o+Paulo,+43+-+Jockey+de+Itaparica,+Vila+Velha+-+ES&output=embed"
            className="aspect-[16/9] w-full rounded-xl border"
            loading="lazy"
          />
        </div>
        <form
          className="space-y-4 rounded-xl border bg-card p-6 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.target as HTMLFormElement);
            const text = `Olá! Sou ${f.get("cn")} (${f.get("ce")}).\n\n${f.get("cm")}`;
            window.open(`https://api.whatsapp.com/send?phone=5527997579959&text=${encodeURIComponent(text)}`, "_blank", "noopener");
            toast.success("Abrindo o WhatsApp para enviar sua mensagem.");
            (e.target as HTMLFormElement).reset();
          }}
        >
          <h2 className="text-3xl">Envie uma mensagem</h2>
          <Field id="cn" name="cn" label="Nome" required />
          <Field id="ce" name="ce" label="E-mail" type="email" required />
          <div className="space-y-1.5">
            <label htmlFor="cm" className="text-sm font-medium">
              Mensagem
            </label>
            <textarea
              id="cm"
              name="cm"
              required
              rows={5}
              className="w-full rounded-md border border-input bg-card p-3.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/25"
            />
          </div>
          <Button variant="dark" size="lg">
            Enviar pelo WhatsApp
          </Button>
        </form>
      </div>
    </>
  );
}
