import { createServerFn } from "@tanstack/react-start";

const EXT = ["pdf", "jpg", "jpeg", "png"];
const MIME: Record<string, string> = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" };
function sniff(b: Uint8Array): string | null {
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return "application/pdf";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  return null;
}
const MAX = 10 * 1024 * 1024;

/**
 * Uploads the pro certificate right after signup, before the e-mail is confirmed (no session yet).
 * Only accepted for a brand-new account that signed up as "profissional" with proof "certificado"
 * and has no request yet, so it cannot be used to attach files to other accounts.
 */
export const submitSignupCertificate = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => {
    if (!(d instanceof FormData)) throw new Error("Dados inválidos.");
    const userId = String(d.get("user_id") ?? "");
    const file = d.get("file");
    if (!/^[0-9a-f-]{36}$/i.test(userId) || !(file instanceof File)) throw new Error("Dados inválidos.");
    return { userId, file, salonLocation: String(d.get("salon_location") ?? "").trim(), salonName: String(d.get("salon_name") ?? "").trim() };
  })
  .handler(async ({ data }) => {
    const ext = data.file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!EXT.includes(ext) || data.file.size > MAX || data.file.size === 0) throw new Error("Arquivo inválido (PDF/JPG/PNG até 10 MB).");
    const head = new Uint8Array(await data.file.slice(0, 8).arrayBuffer());
    if (sniff(head) !== MIME[ext]) throw new Error("Arquivo inválido (PDF/JPG/PNG até 10 MB).");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(data.userId);
    const user = u?.user;
    const meta = (user?.user_metadata ?? {}) as Record<string, unknown>;
    if (!user || meta['account_intent'] !== "profissional" || meta['proof_type'] !== "certificado"
      || Date.now() - new Date(user.created_at).getTime() > 15 * 60 * 1000) throw new Error("Não autorizado.");
    const { count } = await supabaseAdmin.from("pro_requests").select("id", { count: "exact", head: true }).eq("user_id", data.userId);
    if (count) throw new Error("Solicitação já enviada.");
    const path = `${data.userId}/${Date.now()}.${ext}`;
    const up = await supabaseAdmin.storage.from("pro-documents").upload(path, data.file, { contentType: MIME[ext], upsert: false });
    if (up.error) throw new Error("Não foi possível enviar o documento.");
    const { error } = await supabaseAdmin.from("pro_requests").insert({
      user_id: data.userId, proof_type: "certificado", document_path: path,
      salon_location: data.salonLocation || null, salon_name: data.salonName || null,
    });
    if (error) {
      await supabaseAdmin.storage.from("pro-documents").remove([path]);
      throw new Error("Não foi possível registrar a solicitação.");
    }
    return { ok: true };
  });
