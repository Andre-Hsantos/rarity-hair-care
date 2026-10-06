import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const Route = createFileRoute("/_authenticated/admin/clientes")({
  component: () => <AdminPlaceholder title="Clientes" description="Consulta das contas de clientes." next={["Listar clientes", "Ver detalhes e pedidos", "Desconto individual para profissionais"]} />,
});
