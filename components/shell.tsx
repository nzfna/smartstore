"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Calculator, Clock, FileText, Home, LogOut, Menu, Package, ScanBarcode, ShoppingBag, Tags, Truck, X } from "lucide-react";
import { keluar } from "@/lib/auth-actions";
import type { AuthUser } from "@/lib/auth";

const NAV = [
  ["/", "Beranda", Home], ["/stok", "Stok Barang", Package], ["/pembelian", "Pembelian Karung", ShoppingBag],
  ["/sortir", "Sortir & Barcode", ScanBarcode], ["/harga", "Harga per Grade", Tags],
  ["/simulasi", "Simulasi Untung/Rugi", Calculator], ["/supplier", "Supplier", Truck],
  ["/aging", "Aging Alert", Clock], ["/laporan", "Laporan", FileText],
] as const;
const BOTTOM = ["/", "/stok", "/aging"];

function Brand() {
  return (
    <div className="leading-tight">
      <div className="text-lg font-bold text-brand">Thrift Mania</div>
      <div className="text-xs text-muted">SmartStore</div>
    </div>
  );
}

function UserBox({ user }: { user: AuthUser }) {
  return (
    <div className="mt-6 border-t border-line pt-4">
      <div className="text-xs text-muted">Masuk sebagai</div>
      <div className="mt-1 text-sm font-semibold">{user.nama}</div>
      <div className="mb-2 truncate text-xs text-muted" title={user.email}>{user.email}</div>
      <form action={keluar}>
        <button className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm font-medium text-ink hover:bg-page">
          <LogOut size={18} aria-hidden /> Keluar
        </button>
      </form>
    </div>
  );
}

export function Shell({ user, children }: { user: AuthUser; children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [path]);
  const on = (h: string) => (h === "/" ? path === "/" : path.startsWith(h));

  const links = (
    <ul className="space-y-1">
      {NAV.map(([h, l, Icon]) => (
        <li key={h}>
          <Link href={h} aria-current={on(h) ? "page" : undefined}
            className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium ${on(h) ? "bg-brand-soft text-brand-hover" : "text-ink hover:bg-page"}`}>
            <Icon size={18} aria-hidden /> {l}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="min-h-dvh lg:pl-64">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col gap-6 overflow-y-auto border-r border-line bg-white p-4 lg:flex">
        <Brand />
        <nav aria-label="Navigasi utama">{links}</nav>
        <UserBox user={user} />
      </aside>

      <header className="sticky top-0 z-20 flex min-h-14 items-center border-b border-line bg-white px-4 pt-[env(safe-area-inset-top)] lg:hidden">
        <Brand />
      </header>

      <main className="mx-auto max-w-[1440px] px-4 pb-28 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-8">{children}</main>

      <nav aria-label="Navigasi bawah" className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-line bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        {NAV.filter(([h]) => BOTTOM.includes(h)).map(([h, l, Icon]) => (
          <Link key={h} href={h} aria-current={on(h) ? "page" : undefined}
            className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium ${on(h) ? "text-brand-hover" : "text-muted"}`}>
            <Icon size={20} aria-hidden /> {l}
          </Link>
        ))}
        <button onClick={() => setOpen(true)} className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium text-muted">
          <Menu size={20} aria-hidden /> Menu
        </button>
      </nav>

      {open && (
        <div className="fixed inset-0 z-30 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <button aria-label="Tutup menu" className="absolute inset-0 bg-ink/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-72 max-w-[85%] overflow-y-auto bg-white p-4 pt-[calc(1rem+env(safe-area-inset-top))]">
            <div className="mb-4 flex items-center justify-between">
              <Brand />
              <button aria-label="Tutup menu" onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-lg hover:bg-page"><X size={20} /></button>
            </div>
            {links}
            <UserBox user={user} />
          </div>
        </div>
      )}
    </div>
  );
}
