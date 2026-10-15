import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useCatalog, type Product } from "./catalog";

/** Cart line: only id + qty are stored; product data/price always come from the live catalog. */
type CartLine = { id: string; qty: number; p: Product | null };
type Ctx = {
  cart: CartLine[];
  ready: boolean;
  favorites: string[];
  favItems: Product[];
  add: (p: Product, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  toggleFav: (p: Product) => void | Promise<void>;
  count: number;
};

const StoreCtx = createContext<Ctx | null>(null);
const GUEST_KEY = "rarity-guest-cart";
export const GUEST_FAV_KEY = "rarity-guest-favorites";
function readGuestFavs(): string[] {
  try { const v = JSON.parse(localStorage.getItem(GUEST_FAV_KEY) ?? "[]"); return Array.isArray(v) ? [...new Set(v.map(String))] : []; } catch { return []; }
}
type Raw = { id: string; qty: number };

function readGuest(): Raw[] {
  try { return JSON.parse(localStorage.getItem(GUEST_KEY) ?? "[]") as Raw[]; } catch { return []; }
}

// Logged-in cart persists in cart_items; guests keep a localStorage cart that is merged into the account on sign-in.
export function StoreProvider({ children }: { children: ReactNode }) {
  const { session, ready: authReady } = useAuth();
  const uid = session?.user.id ?? null;
  const qc = useQueryClient();
  const catalog = useCatalog();
  const [guest, setGuest] = useState<Raw[]>([]);
  const [guestFavs, setGuestFavs] = useState<string[]>([]);

  useEffect(() => { setGuest(readGuest()); setGuestFavs(readGuestFavs()); }, []);
  const saveGuestFavs = (f: string[]) => { setGuestFavs(f); localStorage.setItem(GUEST_FAV_KEY, JSON.stringify(f)); };

  // Signed-in favorites live in the favorites table (own rows only via RLS); guests keep them in localStorage.
  const dbFavs = useQuery({
    queryKey: ["favorites", uid],
    enabled: !!uid,
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase.from("favorites").select("product_id").eq("user_id", uid!).order("created_at");
      if (error) throw error;
      return data.map((d) => d.product_id);
    },
  });

  // Merge guest favorites into the account once signed in (primary key prevents duplicates).
  useEffect(() => {
    if (!uid) return;
    const f = readGuestFavs();
    if (!f.length) return;
    (async () => {
      // Row by row so one deleted product never blocks merging the others.
      await Promise.all(f.map((product_id) => supabase.from("favorites").upsert({ user_id: uid, product_id }, { onConflict: "user_id,product_id", ignoreDuplicates: true })));
      saveGuestFavs([]);
      qc.invalidateQueries({ queryKey: ["favorites", uid] });
    })();
  }, [uid, qc]);
  const saveGuest = (g: Raw[]) => { setGuest(g); localStorage.setItem(GUEST_KEY, JSON.stringify(g)); };

  const dbCart = useQuery({
    queryKey: ["cart", uid],
    enabled: !!uid,
    queryFn: async (): Promise<Raw[]> => {
      const { data, error } = await supabase.from("cart_items").select("product_id, quantity").eq("user_id", uid!).order("added_at");
      if (error) throw error;
      return data.map((d) => ({ id: d.product_id, qty: d.quantity }));
    },
  });

  // Merge guest cart into the account once signed in.
  useEffect(() => {
    if (!uid) return;
    const g = readGuest();
    if (!g.length) return;
    (async () => {
      const { data } = await supabase.from("cart_items").select("product_id, quantity").eq("user_id", uid);
      const cur = new Map((data ?? []).map((d) => [d.product_id, d.quantity]));
      const rows = g.map((l) => ({ user_id: uid, product_id: l.id, quantity: Math.min(99, (cur.get(l.id) ?? 0) + l.qty) }));
      // Row by row so one deleted product never discards the rest of the guest cart.
      await Promise.all(rows.map((r) => supabase.from("cart_items").upsert(r, { onConflict: "user_id,product_id" })));
      saveGuest([]);
      qc.invalidateQueries({ queryKey: ["cart", uid] });
    })();
  }, [uid, qc]);

  const raw = uid ? dbCart.data ?? [] : guest;
  const byId = useMemo(() => new Map((catalog.data ?? []).map((p) => [p.id, p])), [catalog.data]);
  // Guest cart/favorites: drop products that no longer exist in the live catalog (deleted/inactive).
  useEffect(() => {
    if (uid || !catalog.isSuccess) return;
    const g = readGuest();
    const keep = g.filter((l) => byId.has(l.id));
    if (keep.length !== g.length) saveGuest(keep);
    const f = readGuestFavs();
    const keepF = f.filter((id) => byId.has(id));
    if (keepF.length !== f.length) saveGuestFavs(keepF);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, catalog.isSuccess, byId]);
  const cart: CartLine[] = raw.map((l) => ({ id: l.id, qty: l.qty, p: byId.get(l.id) ?? null }));

  const write = useCallback(async (id: string, qty: number | null) => {
    if (!uid) {
      const g = readGuest();
      saveGuest(qty == null ? g.filter((l) => l.id !== id) : g.some((l) => l.id === id) ? g.map((l) => (l.id === id ? { id, qty } : l)) : [...g, { id, qty }]);
      return;
    }
    const q = qc.getQueryData<Raw[]>(["cart", uid]) ?? [];
    qc.setQueryData<Raw[]>(["cart", uid], qty == null ? q.filter((l) => l.id !== id) : q.some((l) => l.id === id) ? q.map((l) => (l.id === id ? { id, qty } : l)) : [...q, { id, qty }]);
    const res = qty == null
      ? await supabase.from("cart_items").delete().eq("user_id", uid).eq("product_id", id)
      : await supabase.from("cart_items").upsert({ user_id: uid, product_id: id, quantity: qty }, { onConflict: "user_id,product_id" });
    if (res.error) { toast.error("Não foi possível atualizar o carrinho."); qc.invalidateQueries({ queryKey: ["cart", uid] }); }
    // Re-quote only after the saved cart reflects the change (otherwise the quote can use the old quantity).
    qc.invalidateQueries({ queryKey: ["quote"] });
  }, [uid, qc]);

  const add = (p: Product, qty = 1) => {
    if (p.price == null) return;
    const cur = raw.find((l) => l.id === p.id)?.qty ?? 0;
    void write(p.id, Math.min(99, cur + qty));
    toast.success(`${p.name} adicionado ao carrinho`);
  };
  const setQty = (id: string, qty: number) => void write(id, Math.min(99, Math.max(1, qty)));
  const remove = (id: string) => {
    const prev = raw.find((l) => l.id === id);
    const name = byId.get(id)?.name;
    void write(id, null);
    toast(`${name ?? "Item"} removido`, prev ? { action: { label: "Desfazer", onClick: () => void write(id, prev.qty) } } : undefined);
  };
  const favIds = uid ? dbFavs.data ?? [] : guestFavs;
  const toggleFav = async (p: Product) => {
    const has = favIds.includes(p.id);
    toast(has ? "Removido dos favoritos" : "Adicionado aos favoritos");
    if (!uid) { const f = readGuestFavs(); saveGuestFavs(has ? f.filter((x) => x !== p.id) : [...new Set([...f, p.id])]); return; }
    qc.setQueryData<string[]>(["favorites", uid], has ? favIds.filter((x) => x !== p.id) : [...favIds, p.id]);
    const res = has
      ? await supabase.from("favorites").delete().eq("user_id", uid).eq("product_id", p.id)
      : await supabase.from("favorites").upsert({ user_id: uid, product_id: p.id }, { onConflict: "user_id,product_id", ignoreDuplicates: true });
    if (res.error) toast.error("Não foi possível atualizar os favoritos.");
    qc.invalidateQueries({ queryKey: ["favorites", uid] });
  };
  const count = raw.reduce((s, l) => s + l.qty, 0);
  // Only products still visible in the live catalog (with the visitor's correct price) are shown.
  const favItems = favIds.map((id) => byId.get(id)).filter((p): p is Product => !!p);
  const favorites = favItems.map((f) => f.id);
  const ready = authReady && (!uid || dbCart.isFetched) && !catalog.isLoading;

  return (
    <StoreCtx.Provider value={{ cart, ready, favorites, favItems, add, setQty, remove, toggleFav, count }}>
      {children}
    </StoreCtx.Provider>
  );
}

export const useStore = () => {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
};
