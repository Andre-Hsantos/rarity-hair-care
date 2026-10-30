import { createFileRoute, Link, Outlet, redirect } from "@tanstack/react-router";
import { BarChart3, Bell, Boxes, ClipboardList, FolderTree, Layers, Percent, Settings, Tag, UserCheck, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Admin gate: role is checked in the database (has_role on user_roles). RLS also enforces it on every admin read/write.
export const Route = createFileRoute("/_authenticated/admin")({ staticData: { sitemap: "exclude-subtree" },
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
  { to: "/admin/cupons", label: "Cupons", icon: Tag },
  { to: "/admin/promocoes", label: "Promoções", icon: Percent },
  { to: "/admin/quantidade", label: "Desconto por quantidade", icon: Layers },
  { to: "/admin/clientes", label: "Clientes", icon: Users },
  { to: "/admin/notificacoes", label: "Notificações", icon: Bell },
  { to: "/admin/configuracoes", label: "Configurações", icon: Settings },
] as const;

function AdminLayout() {
  return (
    <div className="bg-surface">
      <div className="container-site grid grid-cols-1 gap-4 py-4 sm:gap-8 sm:py-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:py-12">
        <aside className="min-w-0">
          <p className="eyebrow mb-3 text-muted-foreground">Painel administrativo</p>
          <nav className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-2 lg:flex-col lg:overflow-visible">
            {items.map(({ to, label, icon: Icon, ...rest }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: "exact" in rest }}
                className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm text-foreground/75 transition hover:bg-accent hover:text-foreground lg:gap-3 lg:py-2.5"
                activeProps={{ className: "!bg-ink !text-ink-foreground" }}
              >
                <Icon className="size-4 shrink-0" /> {label}
              </Link>
            ))}
          </nav>
        </aside>
        <main className="min-w-0 overflow-x-hidden rounded-lg border bg-background p-4 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
