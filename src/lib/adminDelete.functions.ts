import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Permanently deletes a client: app data (atomic RPC, admin-checked), private documents and login account. */
export const deleteClient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => {
    if (!/^[0-9a-f-]{36}$/i.test(d?.userId ?? "")) throw new Error("Cliente inválido");
    return d;
  })
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Acesso negado");
    if (data.userId === context.userId) throw new Error("Você não pode excluir a própria conta.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Retry path: if app data was already removed, only finish storage + login cleanup.
    const { data: profile } = await supabaseAdmin.from("profiles").select("id").eq("id", data.userId).maybeSingle();
    if (profile) {
      const { error } = await context.supabase.rpc("admin_delete_client_data", { _user_id: data.userId });
      if (error) throw new Error(error.message);
    } else {
      const { data: target } = await supabaseAdmin.auth.admin.getUserById(data.userId);
      if (!target?.user) throw new Error("Cliente não encontrado.");
      const { data: role } = await supabaseAdmin.from("user_roles").select("id").eq("user_id", data.userId).eq("role", "admin").maybeSingle();
      if (role) throw new Error("Contas de administrador não podem ser excluídas por aqui.");
    }

    // Files in the client's own folder belong only to this client.
    const { data: files } = await supabaseAdmin.storage.from("pro-documents").list(data.userId, { limit: 1000 });
    let filesRemoved = 0;
    if (files?.length) {
      const paths = files.map((f) => `${data.userId}/${f.name}`);
      const rm = await supabaseAdmin.storage.from("pro-documents").remove(paths);
      if (rm.error) console.error("pro-documents cleanup failed", rm.error.message);
      else filesRemoved = paths.length;
    }
    const del = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (del.error && del.error.status !== 404) {
      console.error("auth deleteUser failed", del.error.status, del.error.message);
      throw new Error("Dados excluídos, mas falhou ao remover o login. Tente novamente.");
    }
    return { filesRemoved };
  });
