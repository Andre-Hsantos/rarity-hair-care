import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { BarChart3, Bell, Boxes, ClipboardList, FolderTree, Settings, Tag, UserCheck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Admin gate: role is checked in the database (has_role on user_roles). RLS also enforces it on every admin read/write.
export const Route = createFileRoute("/_authenticated/admin")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const user = (context as { user?: { id: string } }).user;
    if (!user) throw redirect({ to: "/login" });
    const { data, error } = await supabase.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (error || data !== true) throw redirect({ to: "/minha-conta" });
  },
  head: () => ({
    meta: [
      { title: "Painel administrativo — Rarity Hair Care" },
      { name: "description", content: "Área restrita de gestão da loja Rarity Hair Care." },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Painel administrativo — Rarity Hair Care" },
      { property: "og:description", content: "Área restrita de gestão da loja." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminLayout,
});

const items = [
  { to: "/admin", label: "Visão geral", icon: BarChart3, exact: true },
  { to: "/admin/produtos", label: "Produtos", icon: Boxes },
  { to: "/admin/categorias", label: "Categorias", icon: FolderTree },
  { to: "/admin/pedidos", label: "Pedidos", icon: ClipboardList },
  { to: "/admin/profissionais", label: "Profissionais", icon: UserCheck },
  { to: "/admin/cupons", label: "Cupons e promoções", icon: Tag },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/notificacoes", label: "Notificações", icon: Bell },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
] as const;

function AdminLayout() {
  return (
    <div className="bg-surface">
      <div className="container-site grid gap-8 py-8 lg:grid-cols-[240px_1fr] lg:py-12">
        <aside>
          <p className="eyebrow mb-3 text-muted-foreground">Painel administrativo</p>
          <nav className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
            {items.map(({ to, label, icon: Icon, ...rest }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: "exact" in rest }}
                className="flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm text-foreground/75 transition hover:bg-accent hover:text-foreground"
                activeProps={{ className: "!bg-ink !text-ink-foreground" }}
              >
                <Icon className="size-4" /> {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 rounded-lg border bg-background p-6 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
