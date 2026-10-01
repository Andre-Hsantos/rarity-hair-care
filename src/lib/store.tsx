import { createContext, useContext, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { getProduct, type Product } from "./products";

type CartLine = { id: string; qty: number };
type Ctx = {
  cart: CartLine[];
  favorites: string[];
  add: (p: Product, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  toggleFav: (p: Product) => void;
  count: number;
};

const StoreCtx = createContext<Ctx | null>(null);

// Prototype-only in-memory state, pre-seeded so cart/favorites look populated.
export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([
    { id: "1", qty: 1 },
    { id: "2", qty: 2 },
  ]);
  const [favorites, setFavorites] = useState<string[]>(["4"]);

  const add = (p: Product, qty = 1) => {
    setCart((c) => {
      const ex = c.find((l) => l.id === p.id);
      return ex ? c.map((l) => (l.id === p.id ? { ...l, qty: l.qty + qty } : l)) : [...c, { id: p.id, qty }];
    });
    toast.success(`${p.name} adicionado ao carrinho`);
  };
  const setQty = (id: string, qty: number) =>
    setCart((c) => c.map((l) => (l.id === id ? { ...l, qty: Math.max(1, qty) } : l)));
  const remove = (id: string) => {
    const p = getProduct(id);
    const prev = cart;
    setCart((c) => c.filter((l) => l.id !== id));
    toast(`${p?.name ?? "Item"} removido`, { action: { label: "Desfazer", onClick: () => setCart(prev) } });
  };
  const toggleFav = (p: Product) => {
    setFavorites((f) => {
      const has = f.includes(p.id);
      toast(has ? "Removido dos favoritos" : "Adicionado aos favoritos");
      return has ? f.filter((x) => x !== p.id) : [...f, p.id];
    });
  };
  const count = cart.reduce((s, l) => s + l.qty, 0);

  return (
    <StoreCtx.Provider value={{ cart, favorites, add, setQty, remove, toggleFav, count }}>
      {children}
    </StoreCtx.Provider>
  );
}

export const useStore = () => {
  const c = useContext(StoreCtx);
  if (!c) throw new Error("useStore outside provider");
  return c;
};
