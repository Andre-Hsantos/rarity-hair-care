import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Briefcase, Heart, KeyRound, LogOut, Package, Trash2, User } from "lucide-react";
import { toast } from "sonner";
import { brl, getProduct } from "@/lib/products";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/site/PageHeader";
import { ProductCard } from "@/components/site/ProductCard";
import { Field } from "@/components/site/Field";
import { Button } from "@/components/ui/button";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/minha-conta")({
  head: () => ({
    meta: [
      { title: "Minha conta — Rarity Hair Care" },
      { name: "description", content: "Perfil, pedidos, notificações e favoritos." },
      { property: "og:title", content: "Minha conta — Rarity Hair Care" },
      { property: "og:description", content: "Área do cliente Rarity." },
    ],
  }),
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

const orders = [
  { id: "#R-1024", date: "12/09", status: "Entregue", total: 209.8 },
  { id: "#R-1019", date: "28/08", status: "Retirado na loja", total: 119.9 },
];

function Account() {
  const [tab, setTab] = useState<Tab>("perfil");
  const { favorites } = useStore();
  const navigate = useNavigate();

  return (
    <>
      <PageHeader title="Minha conta" crumb="Minha conta" subtitle="Olá, Cliente. Dados demonstrativos." />
      <div className="container-site mt-10 grid gap-8 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
          {tabs.map(({ id, label, icon: I }) => (
            <button key={id} onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm transition ${tab === id ? "bg-ink text-ink-foreground" : "hover:bg-accent"}`}>
              <I className="size-4" /> {label}
            </button>
          ))}
          <div className="hidden lg:my-3 lg:block lg:border-t" />
          <AlertDialog>
            <AlertDialogTrigger className="flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm text-destructive hover:bg-destructive/5">
              <Trash2 className="size-4" /> Excluir conta
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir sua conta?</AlertDialogTitle>
                <AlertDialogDescription>Esta ação é permanente. Seus pedidos e favoritos serão removidos.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => toast("Exclusão simulada (demonstrativo).")}>Excluir</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <button onClick={() => { toast("Você saiu da conta."); navigate({ to: "/" }); }} className="flex shrink-0 items-center gap-3 rounded-md px-3 py-2.5 text-sm hover:bg-accent">
            <LogOut className="size-4" /> Sair
          </button>
        </aside>

        <section className="min-w-0 rounded-xl border bg-card p-6 sm:p-8">
          {tab === "perfil" && (
            <form className="grid gap-4 sm:grid-cols-2" onSubmit={(e) => { e.preventDefault(); toast.success("Perfil atualizado"); }}>
              <h2 className="text-3xl sm:col-span-2">Meu perfil</h2>
              <Field id="n" label="Nome" defaultValue="Cliente Demonstrativo" />
              <Field id="e" label="E-mail" type="email" defaultValue="cliente@email.com" />
              <Field id="t" label="WhatsApp" defaultValue="(00) 00000-0000" />
              <Field id="c" label="Cidade" placeholder="Sua cidade" />
              <div className="sm:col-span-2"><Button variant="dark">Salvar alterações</Button></div>
            </form>
          )}
          {tab === "pedidos" && (
            <div>
              <h2 className="text-3xl">Meus pedidos</h2>
              <ul className="mt-6 divide-y rounded-lg border">
                {orders.map((o) => (
                  <li key={o.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                    <div><p className="font-medium">{o.id}</p><p className="text-muted-foreground">{o.date}</p></div>
                    <span className="rounded-full bg-success/10 px-3 py-1 text-xs text-success">{o.status}</span>
                    <span className="font-medium">{brl(o.total)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tab === "notificacoes" && (
            <div>
              <h2 className="text-3xl">Central de notificações</h2>
              <ul className="mt-6 space-y-3">
                {["Seu pedido #R-1024 foi entregue.", "Novidades na linha de tratamentos (demonstrativo)."].map((n, i) => (
                  <li key={n} className="flex gap-3 rounded-lg border p-4 text-sm">
                    <span className={`mt-1.5 size-2 shrink-0 rounded-full ${i === 0 ? "bg-gold" : "bg-border"}`} /> {n}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {tab === "favoritos" && (
            <div>
              <h2 className="text-3xl">Favoritos</h2>
              {favorites.length ? (
                <div className="mt-6 grid grid-cols-2 gap-4 xl:grid-cols-3">
                  {favorites.map((id) => <ProductCard key={id} p={getProduct(id)!} />)}
                </div>
              ) : <p className="mt-4 text-muted-foreground">Você ainda não favoritou produtos.</p>}
            </div>
          )}
          {tab === "pro" && (
            <div className="max-w-lg">
              <h2 className="text-3xl">Solicitar conta profissional</h2>
              <p className="mt-2 text-sm text-muted-foreground">Para profissionais da beleza. A solicitação passará por análise.</p>
              <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Solicitação enviada (demonstrativo)."); }}>
                <Field id="doc" label="CPF ou CNPJ" required />
                <Field id="biz" label="Salão / estabelecimento" />
                <Button variant="gold">Enviar solicitação</Button>
              </form>
            </div>
          )}
          {tab === "senha" && (
            <div className="max-w-md">
              <h2 className="text-3xl">Alterar senha</h2>
              <form className="mt-6 space-y-4" onSubmit={(e) => { e.preventDefault(); toast.success("Senha alterada (demonstrativo)."); }}>
                <Field id="cur" label="Senha atual" type="password" required />
                <Field id="new" label="Nova senha" type="password" required minLength={8} hint="Mínimo de 8 caracteres." />
                <Button variant="dark">Atualizar senha</Button>
              </form>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
