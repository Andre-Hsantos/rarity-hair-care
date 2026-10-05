export function ProofFields() {
  return (
    <>
      <div className="space-y-1.5">
        <label htmlFor="proof_type" className="text-sm font-medium">Tipo de comprovante</label>
        <select id="proof_type" name="proof_type" required className="h-11 w-full rounded-md border border-input bg-card px-3.5 text-sm outline-none focus:border-gold focus:ring-2 focus:ring-gold/25">
          <option value="cnpj">CNPJ</option>
          <option value="mei">MEI</option>
          <option value="certificado">Certificado</option>
        </select>
      </div>
      <div className="space-y-1.5">
        <label htmlFor="doc_file" className="text-sm font-medium">Comprovante (PDF, JPG ou PNG, até 10 MB)</label>
        <input id="doc_file" name="doc_file" type="file" required accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-surface file:px-3 file:py-2 file:text-sm" />
        <p className="text-xs text-muted-foreground">O documento fica em área privada, visível apenas para a administração.</p>
      </div>
    </>
  );
}
