import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * The signed-in user deletes their own account. Personal data is removed and the profile anonymized
 * (orders stay intact for history); private documents are deleted and the login is permanently blocked.
 */
export const deleteOwnAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const uid = context.userId;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: prof } = await supabaseAdmin.from("profiles").select("account_status").eq("id", uid).maybeSingle();
    // Retry path: data already removed earlier, only finish storage + login blocking.
    if (prof?.account_status !== "excluida") {
      const { error } = await context.supabase.rpc("delete_own_account_data");
      if (error) throw new Error(error.message);
    }

    const { data: files } = await supabaseAdmin.storage.from("pro-documents").list(uid, { limit: 1000 });
    if (files?.length) {
      const rm = await supabaseAdmin.storage.from("pro-documents").remove(files.map((f) => `${uid}/${f.name}`));
      if (rm.error) console.error("pro-documents cleanup failed", rm.error.message);
    }
    // Free the e-mail and block any future sign-in; the login row stays because orders reference the profile.
    const upd = await supabaseAdmin.auth.admin.updateUserById(uid, {
      email: `excluido+${uid}@conta-removida.invalid`,
      ban_duration: "876000h",
      user_metadata: {},
    });
    if (upd.error) {
      console.error("auth block failed", upd.error.message);
      throw new Error("Seus dados foram removidos, mas não foi possível encerrar o acesso. Tente novamente.");
    }
    return { ok: true };
  });
