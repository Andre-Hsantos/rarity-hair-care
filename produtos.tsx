import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const Route = createFileRoute("/_authenticated/admin/produtos")({
  component: () => <AdminPlaceholder title="Produtos" description="Gerenciamento do catálogo da loja." next={["Listar produtos do banco", "Cadastrar e editar produtos", "Ativar/inativar e marcar esgotado", "Gerenciar kits"]} />,
});
