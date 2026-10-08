import { useState, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { inputCls } from "@/components/admin/ui";

/** Two-step permanent deletion: step 1 lists what goes, step 2 requires typing EXCLUIR. */
export function DeleteConfirm({ label, title, items, onConfirm, pending }: {
  label: string; title: string; items: ReactNode[]; onConfirm: () => void; pending: boolean;
}) {
  const [step, setStep] = useState<0 | 1 | 2>(0);
  const [word, setWord] = useState("");
  const close = () => { setStep(0); setWord(""); };
  return (
    <>
      <Button type="button" variant="outline" className="w-full border-destructive/40 text-destructive hover:bg-destructive/10" onClick={() => setStep(1)}>
        <Trash2 className="size-4" /> {label}
      </Button>
      <Dialog open={step > 0} onOpenChange={(o) => !o && close()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="text-destructive">{title}</DialogTitle></DialogHeader>
          {step === 1 ? (
            <div className="space-y-4 text-sm">
              <p className="font-medium">Esta exclusão é permanente e não pode ser desfeita. Serão excluídos:</p>
              <ul className="list-disc space-y-1 pl-5 text-muted-foreground">{items.map((i, k) => <li key={k}>{i}</li>)}</ul>
              <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={close}>Cancelar</Button>
                <Button variant="destructive" className="flex-1" onClick={() => setStep(2)}>Continuar</Button></div>
            </div>
          ) : (
            <div className="space-y-4 text-sm">
              <p>Para confirmar, digite <strong>EXCLUIR</strong>:</p>
              <input className={inputCls} value={word} onChange={(e) => setWord(e.target.value)} autoFocus />
              <div className="flex gap-2"><Button variant="outline" className="flex-1" onClick={close}>Cancelar</Button>
                <Button variant="destructive" className="flex-1" disabled={word.trim() !== "EXCLUIR" || pending} onClick={onConfirm}>
                  {pending ? "Excluindo…" : "Excluir definitivamente"}</Button></div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
