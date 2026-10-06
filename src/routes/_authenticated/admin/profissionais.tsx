import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const Route = createFileRoute("/_authenticated/admin/profissionais")({
  component: () => <AdminPlaceholder title="Profissionais" description="Análise das solicitações de conta profissional." next={["Listar solicitações em análise", "Visualizar comprovante privado", "Aprovar ou rejeitar com observação"]} />,
});
