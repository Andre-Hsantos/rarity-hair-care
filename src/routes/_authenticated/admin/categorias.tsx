import { createFileRoute } from "@tanstack/react-router";
import { AdminPlaceholder } from "@/components/admin/AdminPlaceholder";

export const Route = createFileRoute("/_authenticated/admin/categorias")({
  component: () => <AdminPlaceholder title="Categorias" description="Gerenciamento das categorias exibidas no site." next={["Listar categorias", "Criar e editar", "Definir ordem de exibição"]} />,
});
