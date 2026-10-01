import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, Field } from "@/components/site/Field";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Entrar — Rarity Hair Care" },
      { name: "description", content: "Acesse sua conta Rarity Hair Care." },
      { property: "og:title", content: "Entrar — Rarity Hair Care" },
      { property: "og:description", content: "Acesse sua conta Rarity." },
    ],
  }),
  component: Login,
});

function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  return (
    <AuthShell title="Entrar" subtitle="Acesse sua conta para acompanhar pedidos e favoritos.">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          setLoading(true);
          setTimeout(() => {
            toast.success("Bem-vinda de volta! (demonstrativo)");
            navigate({ to: "/minha-conta" });
          }, 700);
        }}
      >
        <Field id="email" label="E-mail" type="email" required placeholder="voce@email.com" autoComplete="email" />
        <Field id="password" label="Senha" type="password" required minLength={6} placeholder="••••••••" autoComplete="current-password" />
        <div className="text-right">
          <a href="#" onClick={(e) => { e.preventDefault(); toast("Enviaremos um link de recuperação (demonstrativo)."); }} className="text-sm text-gold-deep hover:underline">Esqueci minha senha</a>
        </div>
        <Button variant="dark" size="lg" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />} {loading ? "Entrando..." : "Entrar"}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Ainda não tem conta? <Link to="/cadastro" className="font-medium text-foreground underline-offset-4 hover:underline">Criar conta</Link>
      </p>
    </AuthShell>
  );
}
