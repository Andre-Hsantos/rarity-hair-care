import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const Route = createFileRoute("/_authenticated/admin/cupons")({
  component: () => <AdminPlaceholder title="Cupons e promoções" description="Campanhas comerciais da loja." next={["Criar cupons", "Criar promoções por produto", "Definir vigência e limites"]} />,
});
