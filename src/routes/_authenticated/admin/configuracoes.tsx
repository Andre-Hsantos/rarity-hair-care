import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  component: () => <AdminPlaceholder title="Configurações" description="Informações e configurações da loja." next={["Dados de contato da loja", "Redes sociais", "Banners"]} />,
});
