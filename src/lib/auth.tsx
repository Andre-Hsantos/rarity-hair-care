import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProofType = Database["public"]["Enums"]["proof_type"];
/** Access tier derived only from server data (profiles + user_roles), never from client input. */
export type Tier = "admin" | "profissional_aprovado" | "profissional_pendente" | "comum";

export function tierOf(profile: Pick<Profile, "pro_status" | "account_type"> | null, isAdmin: boolean): Tier {
  if (isAdmin) return "admin";
  if (profile?.pro_status === "aprovado" && profile.account_type === "profissional") return "profissional_aprovado";
  if (profile?.pro_status === "em_analise") return "profissional_pendente";
  return "comum";
}

type AuthCtx = {
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  tier: Tier;
  ready: boolean;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
};

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  const load = useCallback(async (s: Session | null) => {
    if (!s) { setProfile(null); setIsAdmin(false); return; }
    const [{ data: p }, { data: roles }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", s.user.id).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", s.user.id),
    ]);
    setProfile(p ?? null);
    setIsAdmin(!!roles?.some((r) => r.role === "admin"));
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        setTimeout(() => { void load(s); router.invalidate(); }, 0);
      }
    });
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      await load(data.session);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [load, router]);

  const value: AuthCtx = {
    session, profile, isAdmin, ready,
    tier: tierOf(profile, isAdmin),
    refresh: () => load(session),
    signOut: async () => { await supabase.auth.signOut(); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAuth must be used inside AuthProvider");
  return c;
}

export const ALLOWED_DOC_EXT = ["pdf", "jpg", "jpeg", "png"];
export const MAX_DOC_BYTES = 10 * 1024 * 1024;

export function validateDoc(file: File | null | undefined): string | null {
  if (!file) return "Envie o comprovante.";
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_DOC_EXT.includes(ext)) return "Formato inválido. Use PDF, JPG ou PNG.";
  if (file.size > MAX_DOC_BYTES) return "Arquivo maior que 10 MB.";
  return null;
}

/** Uploads the proof privately to <user_id>/ and opens a pro request (status em_analise). */
export async function submitProRequest(userId: string, file: File, proofType: ProofType) {
  const err = validateDoc(file);
  if (err) throw new Error(err);
  const ext = file.name.split(".").pop()!.toLowerCase();
  const path = `${userId}/${Date.now()}.${ext}`;
  const up = await supabase.storage.from("pro-documents").upload(path, file, { contentType: file.type, upsert: false });
  if (up.error) throw new Error("Não foi possível enviar o documento.");
  const { error } = await supabase.from("pro_requests").insert({ user_id: userId, proof_type: proofType, document_path: path });
  if (error) throw new Error(error.message.includes("Já existe") ? "Você já tem uma solicitação em análise ou aprovada." : "Não foi possível registrar a solicitação.");
}
