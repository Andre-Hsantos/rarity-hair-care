import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, Field } from "@/components/site/Field";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  async function forgot() {
    if (!email) { toast.error("Digite seu e-mail acima para recuperar a senha."); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/redefinir-senha` });
    if (error) toast.error("Não foi possível enviar o link. Tente novamente.");
    else toast.success("Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.");
  }

  return (
    <AuthShell title="Entrar" subtitle="Acesse sua conta para acompanhar pedidos e favoritos.">
      <form
        className="space-y-5"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          setLoading(true);
          const { error } = await supabase.auth.signInWithPassword({ email: String(fd.get("email")), password: String(fd.get("password")) });
          setLoading(false);
          if (error) {
            toast.error(error.message.includes("Email not confirmed") ? "Confirme seu e-mail antes de entrar." : "E-mail ou senha incorretos.");
            return;
          }
          toast.success("Bem-vinda de volta!");
          navigate({ to: "/minha-conta" });
        }}
      >
        <Field id="email" name="email" label="E-mail" type="email" required placeholder="voce@email.com" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field id="password" name="password" label="Senha" type="password" required minLength={6} placeholder="••••••••" autoComplete="current-password" />
        <div className="text-right">
          <button type="button" onClick={forgot} className="text-sm text-gold-deep hover:underline">Esqueci minha senha</button>
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
