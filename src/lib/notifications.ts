import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";

/** Own notifications only (RLS), newest first. */
export function useMyNotifications() {
  const { session } = useAuth();
  const uid = session?.user.id ?? null;
  return useQuery({
    queryKey: ["notifications", uid],
    enabled: !!uid,
    refetchInterval: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from("notifications").select("id, title, body, link, read_at, created_at")
        .eq("user_id", uid!).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useUnreadCount() {
  const q = useMyNotifications();
  return (q.data ?? []).filter((n) => !n.read_at).length;
}

export function useMarkRead() {
  const qc = useQueryClient();
  const { session } = useAuth();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      if (!ids.length) return;
      const { error } = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).in("id", ids).is("read_at", null);
      if (error) throw error;
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ["notifications", session?.user.id ?? null] }),
  });
}
