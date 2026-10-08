import { createFileRoute } from "@tanstack/react-router";
import { Clock, Instagram, MapPin, MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/site/PageHeader";
import { Field } from "@/components/site/Field";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/contato")({
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

const info = [
  { icon: MessageCircle, label: "WhatsApp", value: "(27) 99757-9959" },
  {
    icon: MapPin,
    label: "Endereço",
    value: "R. São Paulo, 43 - LOJA 368 - Jockey de Itaparica, Vila Velha - ES, 29103-875",
  },
  { icon: Clock, label: "Horário", value: "Sengunda a Sexta <br> 08:00 às 17:00" },
  { icon: Instagram, label: "Redes sociais", value: "rarityprofissionaloficial" },
];

function Contact() {
  return (
    <>
      <PageHeader
        title="Contato"
        crumb="Contato"
        subtitle="Estamos à disposição para ajudar. Dados abaixo são demonstrativos."
      />
      <div className="container-site mt-12 grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <ul className="grid gap-3 sm:grid-cols-2">
            {info.map(({ icon: I, label, value }) => (
              <li key={label} className="flex gap-4 rounded-xl border bg-card p-5">
                <I className="size-5 shrink-0 text-gold-deep" strokeWidth={1.5} />
                <div className="min-w-0">
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{value}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="grid aspect-[16/9] place-items-center rounded-xl border border-dashed bg-surface text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <MapPin className="size-4" /> Mapa (placeholder)
            </span>
          </div>
        </div>
        <form
          className="space-y-4 rounded-xl border bg-card p-6 sm:p-8"
          onSubmit={(e) => {
            e.preventDefault();
            toast.success("Mensagem enviada (demonstrativo).");
            (e.target as HTMLFormElement).reset();
          }}
        >
          <h2 className="text-3xl">Envie uma mensagem</h2>
          <Field id="cn" label="Nome" required />
          <Field id="ce" label="E-mail" type="email" required />
          <div className="space-y-1.5">
            <label htmlFor="cm" className="text-sm font-medium">
              Mensagem
            </label>
            <textarea
              id="cm"
              required
              rows={5}
              className="w-full rounded-md border border-input bg-card p-3.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/25"
            />
          </div>
          <Button variant="dark" size="lg">
            Enviar mensagem
          </Button>
        </form>
      </div>
    </>
  );
}
