"use client";
import Link from "next/link";
import { useActionState } from "react";
import type { FormState } from "@/lib/db";
import { btnPrimary } from "./ui";

export function AuthForm({ action, submit, altText, altHref, altLabel, children }: {
  action: (s: FormState, f: FormData) => Promise<FormState>;
  submit: string; altText: string; altHref: string; altLabel: string; children: React.ReactNode;
}) {
  const [state, run, pending] = useActionState(action, null);
  return (
    <form action={run} className="space-y-4">
      {state?.error && <p role="alert" className="rounded-lg bg-bad-soft px-3 py-2 text-sm text-bad">{state.error}</p>}
      {children}
      <button className={`${btnPrimary} w-full`} disabled={pending}>{pending ? "Mohon tunggu…" : submit}</button>
      <p className="text-center text-sm text-muted">
        {altText} <Link href={altHref} className="font-semibold text-brand-hover underline-offset-2 hover:underline">{altLabel}</Link>
      </p>
    </form>
  );
}
