"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import type { FormState } from "@/lib/db";
import { parseAngka, rp } from "@/lib/format";
import { btnPrimary, btnSecondary } from "./ui";

export function ActionForm({ action, submit, cancelHref, children }: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  submit: string; cancelHref?: string; children: React.ReactNode;
}) {
  const [state, run, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const [per, setPer] = useState<number | null>(null);

  // Pertahankan isian saat validasi gagal.
  useEffect(() => {
    if (!state?.error || !state.values || !ref.current) return;
    for (const [k, v] of Object.entries(state.values)) {
      const el = ref.current.elements.namedItem(k) as HTMLInputElement | null;
      if (el && "value" in el) el.value = v;
    }
  }, [state]);

  return (
    <form
      ref={ref}
      action={run}
      className="space-y-4"
      onChange={(e) => {
        const f = new FormData(e.currentTarget);
        const biaya = parseAngka(f.get("biaya")), potong = parseAngka(f.get("perkiraan_potong"));
        setPer(biaya && potong ? biaya / potong : null);
      }}
    >
      {state?.error && <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{state.error}</p>}
      {state?.ok && !state.error && <p role="status" className="rounded-lg bg-ok-soft px-3 py-2 text-sm text-ok">{state.ok}</p>}
      {children}
      {per !== null && (
        <p className="rounded-lg bg-info-soft px-3 py-2 text-sm">
          Perkiraan modal per potong: <b>{rp(per)}</b> (biaya ÷ perkiraan potong)
        </p>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <button className={btnPrimary} disabled={pending}>{pending ? "Menyimpan…" : submit}</button>
        {cancelHref && <Link href={cancelHref} className={btnSecondary}>Batal</Link>}
      </div>
    </form>
  );
}
