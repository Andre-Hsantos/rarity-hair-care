import { createContext, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";
import type { Product } from "./catalog";

type CartLine = { id: string; qty: number; p: Product };
type Ctx = {
  cart: CartLine[];
  favorites: string[];
  favItems: Product[];
  add: (p: Product, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  toggleFav: (p: Product) => void;
  count: number;
};

const StoreCtx = createContext<Ctx | null>(null);

// In-memory cart/favorites (not persisted yet). Lines keep a product snapshot from the real catalog.
export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [favItems, setFavItems] = useState<Product[]>([]);

  const add = (p: Product, qty = 1) => {
    if (p.price == null) return;
    setCart((c) => {
      const ex = c.find((l) => l.id === p.id);
      return ex ? c.map((l) => (l.id === p.id ? { ...l, qty: l.qty + qty } : l)) : [...c, { id: p.id, qty, p }];
    });
    toast.success(`${p.name} adicionado ao carrinho`);
  };
  const setQty = (id: string, qty: number) =>
    setCart((c) => c.map((l) => (l.id === id ? { ...l, qty: Math.max(1, qty) } : l)));
  const remove = (id: string) => {
    const prev = cart;
    const name = cart.find((l) => l.id === id)?.p.name;
    setCart((c) => c.filter((l) => l.id !== id));
    toast(`${name ?? "Item"} removido`, { action: { label: "Desfazer", onClick: () => setCart(prev) } });
  };
  const toggleFav = (p: Product) => {
    const has = favItems.some((f) => f.id === p.id);
    setFavItems((f) => (has ? f.filter((x) => x.id !== p.id) : [...f, p]));
    toast(has ? "Removido dos favoritos" : "Adicionado aos favoritos");
  };
  const count = cart.reduce((s, l) => s + l.qty, 0);
  const favorites = favItems.map((f) => f.id);

  return (
    <StoreCtx.Provider value={{ cart, favorites, favItems, add, setQty, remove, toggleFav, count }}>
      {children}
    </StoreCtx.Provider>
  );
}

export const useStore = () => {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
};
