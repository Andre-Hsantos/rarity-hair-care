import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AuthShell, Field } from "@/components/site/Field";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/redefinir-senha")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — Rarity Hair Care" },
      { name: "description", content: "Crie uma nova senha para sua conta Rarity Hair Care." },
      { property: "og:title", content: "Redefinir senha — Rarity Hair Care" },
      { property: "og:description", content: "Crie uma nova senha para sua conta." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  return (
    <AuthShell title="Nova senha" subtitle="Digite a nova senha da sua conta.">
      <form
        className="space-y-4"
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const pwd = String(fd.get("pwd"));
          if (pwd !== String(fd.get("pwd2"))) { toast.error("As senhas não coincidem."); return; }
          setLoading(true);
          const { error } = await supabase.auth.updateUser({ password: pwd });
          setLoading(false);
          if (error) { toast.error("Link inválido ou expirado. Solicite um novo na tela de login."); return; }
          toast.success("Senha redefinida!");
          navigate({ to: "/minha-conta" });
        }}
      >
        <Field id="pwd" name="pwd" label="Nova senha" type="password" required minLength={8} hint="Mínimo de 8 caracteres." autoComplete="new-password" />
        <Field id="pwd2" name="pwd2" label="Confirmar nova senha" type="password" required minLength={8} autoComplete="new-password" />
        <Button variant="dark" size="lg" className="w-full" disabled={loading}>Salvar nova senha</Button>
      </form>
    </AuthShell>
  );
}
