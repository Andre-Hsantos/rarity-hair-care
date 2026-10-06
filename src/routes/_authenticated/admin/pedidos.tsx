import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  component: () => <AdminPlaceholder title="Pedidos" description="Consulta e acompanhamento dos pedidos." next={["Listar pedidos", "Alterar status com histórico", "Definir frete (a combinar)", "Marcar venda no Tecnobyte"]} />,
});
