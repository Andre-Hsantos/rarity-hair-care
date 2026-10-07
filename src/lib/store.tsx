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
  toggleFav: (p: Product) => void;
  count: number;
};

const StoreCtx = createContext<Ctx | null>(null);
const GUEST_KEY = "rarity-guest-cart";
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
  const [favItems, setFavItems] = useState<Product[]>([]);

  useEffect(() => { setGuest(readGuest()); }, []);
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
      await supabase.from("cart_items").upsert(rows, { onConflict: "user_id,product_id" });
      saveGuest([]);
      qc.invalidateQueries({ queryKey: ["cart", uid] });
    })();
  }, [uid, qc]);

  const raw = uid ? dbCart.data ?? [] : guest;
  const byId = useMemo(() => new Map((catalog.data ?? []).map((p) => [p.id, p])), [catalog.data]);
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
  const toggleFav = (p: Product) => {
    const has = favItems.some((f) => f.id === p.id);
    setFavItems((f) => (has ? f.filter((x) => x.id !== p.id) : [...f, p]));
    toast(has ? "Removido dos favoritos" : "Adicionado aos favoritos");
  };
  const count = raw.reduce((s, l) => s + l.qty, 0);
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
