import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const Route = createFileRoute("/_authenticated/admin/notificacoes")({
  component: () => <AdminPlaceholder title="Notificações" description="Envio de comunicados aos clientes." next={["Enviar comunicado individual", "Enviar comunicado para grupos"]} />,
});
