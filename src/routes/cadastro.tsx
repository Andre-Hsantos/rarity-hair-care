import { SalonAddressFields } from "@/components/site/SalonAddressFields";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Briefcase, User } from "lucide-react";
import { toast } from "sonner";
import { AuthShell, Field } from "@/components/site/Field";
import { Button } from "@/components/ui/button";
import { ProofFields } from "@/components/site/ProofFields";
import { supabase } from "@/integrations/supabase/client";
import { cleanCnpj, submitProRequest, validateDoc, type ProofType } from "@/lib/auth";

export const Route = createFileRoute("/cadastro")({ staticData: { sitemap: false },
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
  const [loading, setLoading] = useState(false);
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
        onSubmit={async (e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const file = fd.get("doc_file") as File | null;
          const proofType = String(fd.get("proof_type") ?? "") as ProofType;
          const proofNumber = cleanCnpj(fd.get("proof_number"));
          const salonLocation = String(fd.get("salon_location") ?? "").trim();
          const salonName = String(fd.get("salon_name") ?? "").trim();
          if (type === "pro") {
            if (!salonLocation) { toast.error("Informe o endereço do salão."); return; }
            if (proofType === "certificado") { const err = validateDoc(file); if (err) { toast.error(err); return; } }
            else if (!proofNumber) { toast.error("CNPJ inválido. Informe os 14 dígitos."); return; }
          }
          const birth = String(fd.get("birth") ?? "");
          if (!birth || new Date(birth + "T12:00") > new Date()) { toast.error("Informe uma data de nascimento válida."); return; }
          const cpfDigits = String(fd.get("cpf") ?? "").replace(/\D/g, "");
          setLoading(true);
          const { data, error } = await supabase.auth.signUp({
            email: String(fd.get("email")),
            password: String(fd.get("pwd")),
            options: {
              emailRedirectTo: `${window.location.origin}/minha-conta`,
              data: { name: String(fd.get("name")), phone: String(fd.get("phone")), cpf: cpfDigits.length === 11 ? cpfDigits : "", account_intent: type === "pro" ? "profissional" : "comum", birth_date: birth,
                ...(type === "pro" ? { salon_location: salonLocation, salon_name: salonName } : {}),
                ...(type === "pro" && proofType !== "certificado" ? { proof_type: proofType, proof_number: proofNumber } : {}) },
            },
          });
          if (error) {
            setLoading(false);
            const msg = error.message.toLowerCase();
            toast.error(
              error.code === "weak_password" || msg.includes("password") ? "Senha inválida. Use pelo menos 6 caracteres."
              : msg.includes("registered") ? "Este e-mail já está cadastrado."
              : msg.includes("cpf") || msg.includes("duplicate") ? "Este CPF já está em uso."
              : "Não foi possível criar a conta. Verifique os dados e tente novamente.");
            return;
          }
          // CNPJ/MEI requests are opened by the signup itself; only the certificate needs an upload (requires session).
          if (type === "pro" && proofType === "certificado" && data.session && data.user && file) {
            try { await submitProRequest(data.user.id, "certificado", file, null, salonLocation, salonName); }
            catch (err) { toast.error((err as Error).message); }
          }
          setLoading(false);
          if (data.session) {
            toast.success(type === "pro" ? "Conta criada e solicitação enviada para análise." : "Conta criada!");
            navigate({ to: "/minha-conta" });
          } else {
            toast.success(type === "pro" && proofType === "certificado"
              ? "Conta criada! Confirme seu e-mail e, ao entrar, envie o certificado em Minha conta › Conta profissional."
              : type === "pro" ? "Conta criada e solicitação enviada para análise! Confirme seu e-mail para entrar."
              : "Conta criada! Confirme seu e-mail para entrar.", { duration: 10000 });
            navigate({ to: "/login" });
          }
        }}
      >
        <Field id="name" name="name" label="Nome completo" required />
        <Field id="email" name="email" label="E-mail" type="email" required autoComplete="email" />
        <Field id="phone" name="phone" label="WhatsApp" type="tel" required placeholder="(00) 00000-0000" />
        <Field id="birth" name="birth" label="Data de nascimento" type="date" required max={new Date().toISOString().slice(0, 10)} />
        <Field id="cpf" name="cpf" label="CPF" inputMode="numeric" placeholder="000.000.000-00" />
        {type === "pro" && (
          <>
            <Field id="business" name="salon_name" label="Salão / estabelecimento" required />
            <SalonAddressFields />
            <ProofFields />
          </>
        )}
        <Field id="pwd" name="pwd" label="Senha" type="password" required minLength={6} hint="Mínimo de 6 caracteres." autoComplete="new-password" />
        <label className="flex items-start gap-2.5 pt-1 text-sm text-muted-foreground">
          <input type="checkbox" required className="mt-1 accent-[var(--gold-deep)]" />
          Li e aceito os Termos de Uso e a Política de Privacidade.
        </label>
        <Button variant="dark" size="lg" className="w-full" disabled={loading}>{loading ? "Enviando..." : type === "pro" ? "Enviar solicitação" : "Criar conta"}</Button>
      </form>
    </AuthShell>
  );
}
