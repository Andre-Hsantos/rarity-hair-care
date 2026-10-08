import { useState } from "react";
import type { ProofType } from "@/lib/auth";

const options: { id: ProofType; label: string; hint: string }[] = [
  { id: "cnpj", label: "CNPJ", hint: "Informe o número" },
  { id: "mei", label: "MEI", hint: "Informe o CNPJ do MEI" },
  { id: "certificado", label: "Certificado", hint: "Envie o arquivo" },
];

const maskCnpj = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 14);
  return d.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d)/, "$1-$2");
};

/** Proof choice: CNPJ/MEI by number (no upload), Certificado by private file. */
export function ProofFields() {
  const [type, setType] = useState<ProofType>("cnpj");
  const [num, setNum] = useState("");
  return (
    <>
      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">Forma de comprovação</legend>
        <input type="hidden" name="proof_type" value={type} />
        <div className="grid grid-cols-3 gap-2" role="radiogroup">
          {options.map((o) => (
            <button key={o.id} type="button" role="radio" aria-checked={type === o.id} onClick={() => setType(o.id)}
              className={`rounded-md border px-2 py-2.5 text-center text-sm transition ${type === o.id ? "border-gold bg-gold/10 font-medium text-foreground" : "text-muted-foreground hover:border-gold/50"}`}>
              <span className="block">{o.label}</span>
              <span className="block text-[11px] text-muted-foreground">{o.hint}</span>
            </button>
          ))}
        </div>
      </fieldset>
      {type === "certificado" ? (
        <div className="space-y-1.5">
          <label htmlFor="doc_file" className="text-sm font-medium">Certificado (PDF, JPG ou PNG, até 10 MB)</label>
          <input id="doc_file" name="doc_file" type="file" required accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-surface file:px-3 file:py-2 file:text-sm" />
          <p className="text-xs text-muted-foreground">O documento fica em área privada, visível apenas para a administração.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <label htmlFor="proof_number" className="text-sm font-medium">{type === "cnpj" ? "CNPJ" : "CNPJ do MEI"}</label>
          <input id="proof_number" name="proof_number" required inputMode="numeric" placeholder="00.000.000/0000-00" value={num}
            onChange={(e) => setNum(maskCnpj(e.target.value))} pattern="\d{2}\.\d{3}\.\d{3}/\d{4}-\d{2}" title="Informe os 14 dígitos"
            className="h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/25" />
        </div>
      )}
    </>
  );
}
