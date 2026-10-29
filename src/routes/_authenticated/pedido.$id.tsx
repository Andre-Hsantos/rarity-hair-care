import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, MessageCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { fetchOrder } from "@/lib/orderQueries";
import { buildWhatsappMessage, orderNumber, whatsappLink } from "@/lib/orders";
import { OrderDetail } from "@/components/site/OrderDetail";
import { PageHeader } from "@/components/site/PageHeader";
import { buttonVariants } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/pedido/$id")({ staticData: { sitemap: false },
  head: () => ({
    meta: [
      { name: "robots", content: "noindex, nofollow" },
      { title: "Pedido realizado — Rarity Hair Care" },
      { name: "description", content: "Confirmação do seu pedido Rarity Hair Care." },
      { property: "og:title", content: "Pedido realizado — Rarity Hair Care" },
      { property: "og:description", content: "Confirmação do pedido." },
    ],
  }),
  component: OrderPage,
});

// Read-only confirmation: reloading this page never creates a new order.
function OrderPage() {
  const { id } = Route.useParams();
  const { profile } = useAuth();
  const q = useQuery({ queryKey: ["order", id], queryFn: () => fetchOrder(Number(id)) });
  const o = q.data;
  return (
    <>
      <PageHeader title="Pedido realizado" crumb="Pedido" />
      <div className="container-site mt-10 max-w-2xl">
        {q.isLoading ? <p className="text-muted-foreground">Carregando…</p> : !o ? (
          <p className="rounded-xl border border-dashed p-10 text-center">Pedido não encontrado.</p>
        ) : (
          <div className="space-y-6 rounded-xl border bg-card p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-1 size-6 shrink-0 text-success" />
              <div><p className="font-display text-3xl">Pedido {orderNumber(o.id)} registrado</p>
                <p className="mt-1 text-muted-foreground">Envie a mensagem no WhatsApp para a loja dar sequência ao atendimento. Para alterar o pedido, fale com a loja.</p></div>
            </div>
            <a href={whatsappLink(buildWhatsappMessage({ ...o, customerName: profile?.name || "Cliente" }))} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "gold", size: "lg", className: "w-full" })}>
              <MessageCircle className="size-4" /> Abrir WhatsApp
            </a>
            <OrderDetail o={o} showHistory={false} />
            <Link to="/minha-conta" className="block text-center text-sm text-muted-foreground hover:text-foreground">Ver meus pedidos</Link>
          </div>
        )}
      </div>
    </>
  );
}
