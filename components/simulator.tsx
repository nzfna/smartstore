"use client";
import { useState } from "react";
import { parseAngka as n, rp } from "@/lib/format";
import { input } from "./ui";

export function Simulator({ harga }: { harga: Record<string, number> }) {
  const [v, set] = useState({ biaya: "6500000", potong: "150", a: "20", b: "50", c: "30", laku: "80", ha: String(harga.A), hb: String(harga.B), hc: String(harga.C) });
  const on = (k: keyof typeof v) => (e: React.ChangeEvent<HTMLInputElement>) => set({ ...v, [k]: e.target.value });
  const biaya = n(v.biaya), potong = n(v.potong), laku = Math.min(n(v.laku), 100);
  const komp = [n(v.a), n(v.b), n(v.c)], hg = [n(v.ha), n(v.hb), n(v.hc)];
  const terjual = potong * laku / 100;
  const pendapatan = komp.reduce((s, k, i) => s + potong * k / 100 * hg[i], 0) * laku / 100;
  const laba = pendapatan - biaya;
  const jumlahKomp = komp.reduce((a, b) => a + b, 0);
  const F = (label: string, k: keyof typeof v, hint?: string) => (
    <div key={k}>
      <label htmlFor={k} className="mb-1 block text-sm font-medium">{label}</label>
      <input id={k} className={input} inputMode="numeric" value={v[k]} onChange={on(k)} />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="space-y-5">
        <h2 className="text-[17px] font-semibold lg:text-lg">Data pembelian</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {F("Biaya pembelian karung (Rp)", "biaya")}
          {F("Perkiraan jumlah potong", "potong")}
        </div>
        <h2 className="text-[17px] font-semibold lg:text-lg">Perkiraan komposisi grade (%)</h2>
        <div className="grid grid-cols-3 gap-3">{F("Grade A", "a")}{F("Grade B", "b")}{F("Grade C", "c")}</div>
        {jumlahKomp !== 100 && <p role="alert" className="rounded-lg bg-warn-soft px-3 py-2 text-sm text-warn">Komposisi berjumlah {jumlahKomp}%, sebaiknya 100%.</p>}
        <h2 className="text-[17px] font-semibold lg:text-lg">Harga jual dan asumsi laku</h2>
        <div className="grid grid-cols-3 gap-3">{F("Harga A", "ha")}{F("Harga B", "hb")}{F("Harga C", "hc")}</div>
        {F("Perkiraan barang laku (%)", "laku", "Contoh: 80 berarti 8 dari 10 potong terjual.")}
      </section>

      <section aria-live="polite" className="h-fit rounded-xl border border-line bg-white p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold lg:text-lg">Hasil perkiraan</h2>
          <span className="rounded-full bg-info-soft px-2.5 py-0.5 text-xs font-medium">Estimasi, bukan hasil aktual</span>
        </div>
        <dl className="divide-y divide-line text-sm">
          {[
            ["Biaya pembelian", rp(biaya)],
            ["Perkiraan barang terjual", `${Math.round(terjual)} potong`],
            ["Estimasi pendapatan", rp(pendapatan)],
          ].map(([a, b]) => (<div key={a} className="flex justify-between py-2.5"><dt className="text-muted">{a}</dt><dd className="font-medium">{b}</dd></div>))}
          <div className="flex items-center justify-between py-3">
            <dt className="font-semibold">Estimasi {laba >= 0 ? "untung" : "rugi"}</dt>
            <dd className="flex items-center gap-2">
              <span className="text-lg font-bold">{rp(Math.abs(laba))}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${laba >= 0 ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"}`}>{laba >= 0 ? "Untung" : "Rugi"}</span>
            </dd>
          </div>
        </dl>
        <div className="mt-2 rounded-lg bg-page p-3 text-sm">
          <p className="font-medium">Titik impas harga rata-rata per potong</p>
          <p className="mt-1 text-muted">Jika semua laku: <b className="text-ink">{potong ? rp(biaya / potong) : "-"}</b></p>
          <p className="text-muted">Jika {laku}% laku: <b className="text-ink">{potong && laku ? rp(biaya / (potong * laku / 100)) : "-"}</b></p>
        </div>
        <p className="mt-4 text-xs text-muted">Asumsi: setiap grade punya tingkat laku yang sama, dan tidak ada biaya lain (tenaga, listrik, ongkos kirim). Hasil sungguhan tergantung barang yang benar-benar terjual.</p>
      </section>
    </div>
  );
}
