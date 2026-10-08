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
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // List the client's own folder before data removal (files belong only to this user).
    const { data: files } = await supabaseAdmin.storage.from("pro-documents").list(data.userId, { limit: 1000 });

    const { error } = await context.supabase.rpc("admin_delete_client_data", { _user_id: data.userId });
    if (error) throw new Error(error.message);

    let filesRemoved = 0;
    if (files?.length) {
      const paths = files.map((f) => `${data.userId}/${f.name}`);
      const rm = await supabaseAdmin.storage.from("pro-documents").remove(paths);
      if (!rm.error) filesRemoved = paths.length;
    }
    const del = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (del.error && !/not.*found/i.test(del.error.message)) throw new Error("Dados excluídos, mas falhou ao remover o login. Tente novamente.");
    return { filesRemoved };
  });
