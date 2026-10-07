import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { inputCls } from "./ui";

export function useAllProducts() {
  return useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}
export function useAllCategories() {
  return useQuery({
    queryKey: ["admin-categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("*, products(count)").order("display_order").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function CheckList({ items, selected, onChange, placeholder = "Buscar…" }: {
  items: { id: string; label: string; sub?: string | undefined }[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
}) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => items.filter((i) => `${i.id} ${i.label}`.toLowerCase().includes(q.toLowerCase())), [items, q]);
  return (
    <div className="rounded-md border">
      <input className={`${inputCls} rounded-b-none border-0 border-b`} placeholder={placeholder} value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="max-h-44 overflow-y-auto p-1">
        {shown.length === 0 && <p className="p-2 text-xs text-muted-foreground">Nada encontrado.</p>}
        {shown.map((i) => (
          <label key={i.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-accent">
            <input type="checkbox" className="accent-[var(--gold-deep)]" checked={selected.includes(i.id)}
              onChange={(e) => onChange(e.target.checked ? [...selected, i.id] : selected.filter((s) => s !== i.id))} />
            <span className="flex-1">{i.label}</span>
            {i.sub && <span className="text-xs text-muted-foreground">{i.sub}</span>}
          </label>
        ))}
      </div>
      <p className="border-t px-3 py-1.5 text-xs text-muted-foreground">{selected.length} selecionado(s)</p>
    </div>
  );
}
