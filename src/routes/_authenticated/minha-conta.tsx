import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Briefcase, Heart, KeyRound, LogOut, Package, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { brl } from "@/lib/catalog";
import { useQuery } from "@tanstack/react-query";
import { fetchOrder } from "@/lib/orderQueries";
import { orderNumber } from "@/lib/orders";
import { OrderDetail, StatusBadge } from "@/components/site/OrderDetail";
import { GUEST_FAV_KEY, useStore } from "@/lib/store";
import { MyNotifications } from "@/components/site/MyNotifications";
import { deleteOwnAccount } from "@/lib/account.functions";
import { PageHeader } from "@/components/site/PageHeader";
import { ProductCard } from "@/components/site/ProductCard";
import { Field } from "@/components/site/Field";
import { Button } from "@/components/ui/button";
import { ProofFields } from "@/components/site/ProofFields";
import { supabase } from "@/integrations/supabase/client";
import { submitProRequest, useAuth, type ProofType } from "@/lib/auth";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/minha-conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — Rarity Hair Care" },
      { name: "description", content: "Perfil, pedidos, notificações e favoritos." },
      { property: "og:title", content: "Minha conta — Rarity Hair Care" },
      { property: "og:description", content: "Área do cliente Rarity." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): { tab?: Tab | undefined } => ({ tab: tabs.some((t) => t.id === s["tab"]) ? (s["tab"] as Tab) : undefined }),
  component: Account,
});

const tabs = [
  { id: "perfil", label: "Meu perfil", icon: User },
  { id: "pedidos", label: "Meus pedidos", icon: Package },
  { id: "notificacoes", label: "Notificações", icon: Bell },
  { id: "favoritos", label: "Favoritos", icon: Heart },
  { id: "pro", label: "Conta profissional", icon: Briefcase },
  { id: "senha", label: "Alterar senha", icon: KeyRound },
] as const;
type Tab = (typeof tabs)[number]["id"];


const tierLabel = {
  admin: "Administrador",
  profissional_aprovado: "Profissional aprovado",
  profissional_pendente: "Profissional em análise",
  comum: "Cliente",
} as const;

function Account() {
  const search = Route.useSearch();
  const tab: Tab = search.tab ?? "perfil";
  const setTab = (t: Tab) => navigate({ to: "/minha-conta", search: { tab: t }, replace: true });
  const { favItems: favorites } = useStore();
  const { session, profile, tier, refresh, signOut } = useAuth();
  const navigate = useNavigate();
  const firstName = profile?.name?.split(" ")[0] || "Cliente";

  return (
    <>
      <PageHeader title="Minha conta" crumb="Minha conta" subtitle={`Olá, ${firstName}. Tipo de conta: ${tierLabel[tier]}.`} />
      <div className="container-site mt-10 grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
          {tabs.map(({ id, label, icon: I }) => (
            <button key={id} onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${tab === id ? "bg-ink text-ink-foreground" : "hover:bg-accent"}`}>
              <I className="size-4" /> {label}
            </button>
          ))}
          <div className="hidden lg:my-3 lg:block lg:border-t" />
          <DeleteAccount isAdmin={tier === "admin"} />
          <button onClick={async () => { await signOut(); toast("Você saiu da conta."); navigate({ to: "/" }); }} className="flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-accent">
            <LogOut className="size-4" /> Sair
          </button>
        </aside>

        <section className="min-w-0 rounded-xl border bg-card p-6 sm:p-8">
          {tab === "perfil" && (
            <form
              key={profile?.updated_at ?? "p"}
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={async (e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                const cpf = String(fd.get("cpf") ?? "").replace(/\D/g, "");
                const birth = String(fd.get("birth") ?? "");
                const { error } = await supabase.rpc("update_own_profile", {
                  _name: String(fd.get("name")), _phone: String(fd.get("phone")),
                  _birth_date: (birth || null) as string, _cpf: (cpf || null) as string,
                });
                if (error) { toast.error("Não foi possível salvar (CPF pode já estar em uso)."); return; }
                await refresh();
                toast.success("Perfil atualizado");
              }}
            >
              <h2 className="text-3xl sm:col-span-2">Meu perfil</h2>
              <Field id="name" name="name" label="Nome" required defaultValue={profile?.name ?? ""} />
              <Field id="e" label="E-mail" type="email" disabled defaultValue={profile?.email ?? session?.user.email ?? ""} />
              <Field id="phone" name="phone" label="WhatsApp" defaultValue={profile?.phone ?? ""} />
              <Field id="cpf" name="cpf" label="CPF" inputMode="numeric" defaultValue={profile?.cpf ?? ""} />
              <Field id="birth" name="birth" label="Data de nascimento" type="date" defaultValue={profile?.birth_date ?? ""} />
              <div className="sm:col-span-2"><Button variant="dark">Salvar alterações</Button></div>
            </form>
          )}
          {tab === "pedidos" && <MyOrders />}
          {tab === "notificacoes" && <MyNotifications />}
          {tab === "favoritos" && (
            <div>
              <h2 className="text-3xl">Favoritos</h2>
              {favorites.length ? (
                <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
                  {favorites.map((p) => <ProductCard key={p.id} p={p} />)}
                </div>
              ) : <p className="mt-4 text-muted-foreground">Você ainda não favoritou produtos.</p>}
            </div>
          )}
          {tab === "pro" && (
            <div className="max-w-lg">
              <h2 className="text-3xl">Conta profissional</h2>
              {tier === "profissional_aprovado" || tier === "admin" ? (
                <p className="mt-4 text-sm text-success">Sua conta profissional está aprovada.</p>
              ) : tier === "profissional_pendente" ? (
                <p className="mt-4 text-sm text-muted-foreground">Sua solicitação está em análise. Você será avisada quando houver uma decisão.</p>
              ) : (
                <>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {profile?.pro_status === "rejeitado" ? "Sua solicitação anterior não foi aprovada. Você pode enviar um novo comprovante." : "Para profissionais da beleza. A solicitação passará por análise."}
                  </p>
                  <form
                    className="mt-6 space-y-4"
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      try {
                        await submitProRequest(session!.user.id, fd.get("doc_file") as File, String(fd.get("proof_type")) as ProofType);
                        await refresh();
                        toast.success("Solicitação enviada para análise.");
                      } catch (err) { toast.error((err as Error).message); }
                    }}
                  >
                    <ProofFields />
                    <Button variant="gold">Enviar solicitação</Button>
                  </form>
                </>
              )}
            </div>
          )}
          {tab === "senha" && (
            <div className="max-w-md">
              <h2 className="text-3xl">Alterar senha</h2>
              <form
                className="mt-6 space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.currentTarget;
                  const fd = new FormData(form);
                  const email = session?.user.email ?? "";
                  const check = await supabase.auth.signInWithPassword({ email, password: String(fd.get("cur")) });
                  if (check.error) { toast.error("Senha atual incorreta."); return; }
                  const { error } = await supabase.auth.updateUser({ password: String(fd.get("new")) });
                  if (error) { toast.error("Não foi possível alterar a senha."); return; }
                  form.reset();
                  toast.success("Senha alterada.");
                }}
              >
                <Field id="cur" name="cur" label="Senha atual" type="password" required autoComplete="current-password" />
                <Field id="new" name="new" label="Nova senha" type="password" required minLength={8} hint="Mínimo de 8 caracteres." autoComplete="new-password" />
                <Button variant="dark">Atualizar senha</Button>
              </form>
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function MyOrders() {
  const { session } = useAuth();
  const [open, setOpen] = useState<number | null>(null);
  const list = useQuery({
    queryKey: ["my-orders", session?.user.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("id, created_at, status, total, delivery_method, shipping").eq("user_id", session!.user.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const detail = useQuery({ queryKey: ["order", String(open)], enabled: open != null, queryFn: () => fetchOrder(open!) });
  return (
    <div>
      <h2 className="text-3xl">Meus pedidos</h2>
      {list.isLoading ? <p className="mt-4 text-muted-foreground">Carregando…</p> : !list.data?.length ? <p className="mt-4 text-muted-foreground">Você ainda não fez pedidos.</p> : (
        <ul className="mt-6 divide-y rounded-lg border">
          {list.data.map((o) => (
            <li key={o.id}>
              <button onClick={() => setOpen(open === o.id ? null : o.id)} className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left text-sm hover:bg-accent/50">
                <div><p className="font-medium">Pedido {orderNumber(o.id)}</p><p className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")} · {o.delivery_method === "entrega" ? "Entrega" : "Retirada"}</p></div>
                <StatusBadge status={o.status} />
                <span className="font-medium">{brl(Number(o.total))}</span>
              </button>
              {open === o.id && <div className="border-t bg-surface/50 p-4">{detail.data ? <OrderDetail o={detail.data} /> : <p className="text-muted-foreground">Carregando…</p>}</div>}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-4 text-xs text-muted-foreground">Para alterar ou cancelar um pedido, fale com a loja pelo WhatsApp.</p>
    </div>
  );
}


function DeleteAccount({ isAdmin }: { isAdmin: boolean }) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [word, setWord] = useState("");
  const [busy, setBusy] = useState(false);
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const close = () => { setStep(0); setWord(""); };
  const run = async () => {
    setBusy(true);
    try {
      await deleteOwnAccount();
      localStorage.removeItem(GUEST_FAV_KEY);
      localStorage.removeItem("rarity-guest-cart");
      await signOut().catch(() => {});
      close();
      navigate({ to: "/" });
      toast.success("Sua conta foi excluída. Sentiremos sua falta.");
    } catch (e) {
      toast.error((e as Error).message || "Não foi possível excluir a conta.");
    } finally { setBusy(false); }
  };
  return (
    <>
      <button onClick={() => isAdmin ? toast.error("Contas de administrador não podem ser excluídas por aqui.") : setStep(1)} className="flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm text-destructive hover:bg-destructive/5">
        <Trash2 className="size-4" /> Excluir conta
      </button>
      <Dialog open={step > 0} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir sua conta?</DialogTitle>
            <DialogDescription>Esta ação é permanente e não pode ser desfeita.</DialogDescription>
          </DialogHeader>
          {step === 1 ? (
            <div className="space-y-4 text-sm">
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                <li>Seus dados pessoais, endereços, favoritos, carrinho e notificações serão apagados.</li>
                <li>Documentos e solicitação de conta profissional serão apagados.</li>
                <li>Você não poderá mais entrar com esta conta.</li>
                <li>Os pedidos já feitos ficam guardados pela loja, sem seus dados pessoais, para o histórico.</li>
              </ul>
              <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={close}>Cancelar</Button>
                <Button variant="destructive" className="flex-1" onClick={() => setStep(2)}>Continuar</Button></div>
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <p>Para confirmar, digite <strong>EXCLUIR</strong>:</p>
              <input className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus:border-gold" value={word} onChange={(e) => setWord(e.target.value)} autoFocus />
              <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={close}>Cancelar</Button>
                <Button variant="destructive" className="flex-1" disabled={word.trim() !== "EXCLUIR" || busy} onClick={run}>{busy ? "Excluindo…" : "Excluir minha conta"}</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
