import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Briefcase, User } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, Field } from "@/components/site/Field";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cadastro")({
  head: () => ({
    meta: [
      { title: "Criar conta — Rarity Hair Care" },
      { name: "description", content: "Crie sua conta normal ou profissional na Rarity Hair Care." },
      { property: "og:title", content: "Criar conta — Rarity Hair Care" },
      { property: "og:description", content: "Conta normal ou profissional." },
    ],
  }),
  component: Signup,
});

function Signup() {
  const [type, setType] = useState<null | "normal" | "pro">(null);
  const navigate = useNavigate();

  if (!type)
    return (
      <AuthShell title="Criar conta" subtitle="Como você deseja criar sua conta?">
        <div className="grid gap-3">
          {([
            ["normal", User, "Conta normal", "Para compras pessoais."],
            ["pro", Briefcase, "Conta profissional", "Para cabeleireiros e salões."],
          ] as const).map(([k, I, t, d]) => (
            <button key={k} onClick={() => setType(k)} className="flex items-center gap-4 rounded-xl border p-5 text-left transition hover:border-gold hover:bg-gold/5">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-surface"><I className="size-5 text-gold-deep" strokeWidth={1.5} /></span>
              <span><span className="block font-medium">{t}</span><span className="text-sm text-muted-foreground">{d}</span></span>
            </button>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Já tem conta? <Link to="/login" className="font-medium text-foreground hover:underline">Entrar</Link>
        </p>
      </AuthShell>
    );

  return (
    <AuthShell title={type === "pro" ? "Conta profissional" : "Conta normal"}>
      <button onClick={() => setType(null)} className="-mt-4 mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Alterar tipo de conta
      </button>
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          toast.success(type === "pro" ? "Solicitação enviada para análise (demonstrativo)." : "Conta criada! (demonstrativo)");
          navigate({ to: "/minha-conta" });
        }}
      >
        <Field id="name" label="Nome completo" required />
        <Field id="email" label="E-mail" type="email" required />
        <Field id="phone" label="WhatsApp" type="tel" required placeholder="(00) 00000-0000" />
        {type === "pro" && (
          <>
            <Field id="doc" label="CPF ou CNPJ" required />
            <Field id="business" label="Salão / estabelecimento" />
            <Field id="area" label="Área de atuação" placeholder="Ex.: cabeleireira, colorista" />
          </>
        )}
        <Field id="pwd" label="Senha" type="password" required minLength={8} hint="Mínimo de 8 caracteres." />
        <label className="flex items-start gap-2.5 pt-1 text-sm text-muted-foreground">
          <input type="checkbox" required className="mt-1 accent-[var(--gold-deep)]" />
          Li e aceito os Termos de Uso e a Política de Privacidade.
        </label>
        <Button variant="dark" size="lg" className="w-full">{type === "pro" ? "Enviar solicitação" : "Criar conta"}</Button>
      </form>
    </AuthShell>
  );
}
