import { useState } from "react";
import { toast } from "sonner";

const inp = "w-full rounded-md border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--gold-deep)]";

/** Separate salon address inputs; combined into one hidden "salon_location" value for the form. */
export function SalonAddressFields() {
  const [a, setA] = useState({ zip: "", street: "", number: "", complement: "", district: "", city: "", state: "" });
  const combined = a.street && a.number && a.district && a.city && a.state
    ? `${a.street}, ${a.number}${a.complement ? ` - ${a.complement}` : ""}, ${a.district}, ${a.city} - ${a.state}${a.zip ? `, CEP ${a.zip}` : ""}`
    : "";
  const set = (k: keyof typeof a) => (e: React.ChangeEvent<HTMLInputElement>) => setA((p) => ({ ...p, [k]: e.target.value }));
  return (
    <fieldset className="space-y-2">
      <legend className="mb-1.5 text-sm font-medium">Endereço do salão</legend>
      <input type="hidden" name="salon_location" value={combined} />
      <div className="grid grid-cols-6 gap-2">
        <input className={`${inp} col-span-6 sm:col-span-2`} placeholder="CEP" inputMode="numeric" maxLength={9} value={a.zip} onChange={async (e) => {
          const zip = e.target.value;
          setA((p) => ({ ...p, zip }));
          const d = zip.replace(/\D/g, "");
          if (d.length !== 8) return;
          try {
            const r = await fetch(`https://viacep.com.br/ws/${d}/json/`).then((x) => x.json());
            if (r.erro) { toast.error("CEP não encontrado."); return; }
            setA((p) => ({ ...p, street: r.logradouro || p.street, district: r.bairro || p.district, city: r.localidade || p.city, state: r.uf || p.state }));
          } catch { /* preenchimento manual */ }
        }} />
        <input className={`${inp} col-span-6 sm:col-span-4`} placeholder="Rua *" required value={a.street} onChange={set("street")} />
        <input className={`${inp} col-span-2`} placeholder="Número *" required value={a.number} onChange={set("number")} />
        <input className={`${inp} col-span-4`} placeholder="Complemento" value={a.complement} onChange={set("complement")} />
        <input className={`${inp} col-span-6 sm:col-span-3`} placeholder="Bairro *" required value={a.district} onChange={set("district")} />
        <input className={`${inp} col-span-4 sm:col-span-2`} placeholder="Cidade *" required value={a.city} onChange={set("city")} />
        <input className={`${inp} col-span-2 sm:col-span-1`} placeholder="UF *" required maxLength={2} value={a.state} onChange={(e) => setA((p) => ({ ...p, state: e.target.value.toUpperCase() }))} />
      </div>
    </fieldset>
  );
}
