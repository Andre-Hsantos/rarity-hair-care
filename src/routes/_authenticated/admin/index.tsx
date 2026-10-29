import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/")({ staticData: { sitemap: false }, component: Overview });

async function count(table: "orders" | "products" | "pro_requests", pending = false) {
  let q = supabase.from(table).select("*", { count: "exact", head: true });
  if (pending) q = q.eq("status", "em_analise");
  const { count: c, error } = await q;
  if (error) throw error;
  return c ?? 0;
}

function Stat({ label, value, to, loading }: { label: string; value: number | undefined; to: string; loading: boolean }) {
  return (
    <Link to={to} className="rounded-lg border bg-card p-5 transition hover:border-gold">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-4xl">{loading ? "…" : value ?? "—"}</p>
    </Link>
  );
}

function Overview() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: async () => {
      const [orders, products, pending] = await Promise.all([count("orders"), count("products"), count("pro_requests", true)]);
      return { orders, products, pending };
    },
  });
  return (
    <div>
      <h1 className="text-3xl sm:text-4xl">Visão geral</h1>
      <p className="mt-2 text-muted-foreground">Números lidos diretamente do banco de dados da loja.</p>
      {isError && <p className="mt-4 text-sm text-destructive">Não foi possível carregar os números.</p>}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Pedidos" value={data?.orders} to="/admin/pedidos" loading={isLoading} />
        <Stat label="Produtos cadastrados" value={data?.products} to="/admin/produtos" loading={isLoading} />
        <Stat label="Solicitações profissionais pendentes" value={data?.pending} to="/admin/profissionais" loading={isLoading} />
      </div>
    </div>
  );
}
