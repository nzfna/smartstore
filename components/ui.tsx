import Link from "next/link";
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

const b = "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-60";
export const btnPrimary = `${b} bg-brand text-white hover:bg-brand-hover`;
export const btnSecondary = `${b} border border-line bg-white text-ink hover:bg-page`;
export const btnDanger = `${b} bg-bad text-white hover:opacity-90`;
export const input = "min-h-11 w-full rounded-lg border border-line bg-white px-3 text-sm text-ink placeholder:text-muted/70 focus-visible:outline-2 focus-visible:outline-brand";

const TONE = {
  ok: "bg-ok-soft text-ok", warn: "bg-warn-soft text-warn", brand: "bg-brand-soft text-brand-hover",
  info: "bg-info-soft text-ink", muted: "border border-line bg-page text-muted", bad: "bg-bad-soft text-bad",
};
export const STATUS: Record<string, [string, keyof typeof TONE]> = {
  tersedia: ["Tersedia", "ok"], perlu_diperiksa: ["Perlu diperiksa", "warn"], perlu_obral: ["Perlu obral", "brand"],
  diobral: ["Sedang diobral", "info"], ditinjau: ["Sudah ditindaklanjuti", "info"], habis: ["Habis", "muted"],
  belum: ["Belum disortir", "muted"], proses: ["Sedang disortir", "warn"], selesai: ["Sortir selesai", "ok"],
};
export function Badge({ status }: { status: string }) {
  const [label, tone] = STATUS[status] ?? [status, "muted" as const];
  return <span className={`inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE[tone]}`}>{label}</span>;
}

export function PageHeader({ title, desc, action, crumbs }: { title: string; desc: string; action?: ReactNode; crumbs?: [string, string][] }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {crumbs && (
          <nav aria-label="Breadcrumb" className="mb-1 text-xs text-muted">
            {crumbs.map(([h, l]) => (<span key={h}><Link href={h} className="underline-offset-2 hover:underline">{l}</Link> / </span>))}
          </nav>
        )}
        <h1 className="text-[23px] font-bold leading-tight sm:text-[28px]">{title}</h1>
        <p className="mt-1 text-muted">{desc}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Notice({ sp }: { sp: { ok?: string; err?: string } }) {
  if (!sp.ok && !sp.err) return null;
  return (
    <p role={sp.err ? "alert" : "status"} className={`mb-5 rounded-lg px-4 py-3 text-sm ${sp.err ? "bg-bad-soft text-bad" : "bg-ok-soft text-ok"}`}>
      {sp.err ?? sp.ok}
    </p>
  );
}

export function Empty({ text, action }: { text: string; action?: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-white px-4 py-10 text-center">
      <p className="mx-auto max-w-sm text-muted">{text}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

type FP = { label: string; name: string; hint?: string };
export function Field({ label, name, hint, ...p }: FP & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">{label}</label>
      <input id={name} name={name} className={input} {...p} />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
export function SelectField({ label, name, hint, children, ...p }: FP & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label htmlFor={name} className="mb-1 block text-sm font-medium">{label}</label>
      <select id={name} name={name} className={input} {...p}>{children}</select>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Thumb({ url }: { url?: string | null }) {
  // eslint-disable-next-line @next/next/no-img-element
  return url ? <img src={url} alt="" loading="lazy" referrerPolicy="no-referrer" className="size-12 shrink-0 rounded-lg border border-line object-cover" /> : <div className="size-12 shrink-0 rounded-lg border border-line bg-page" aria-hidden />;
}
