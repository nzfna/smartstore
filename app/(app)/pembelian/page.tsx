import Link from "next/link";
import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { rp, tgl } from "@/lib/format";
import { Empty, Notice, PageHeader, btnPrimary } from "@/components/ui";

export default async function Pembelian({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const rows = await sql`SELECT p.*, p.tanggal::text AS tgl, s.nama AS supplier FROM purchases p
    LEFT JOIN suppliers s ON s.id = p.supplier_id AND s.user_id = p.user_id
    WHERE p.user_id = ${user.id} ORDER BY p.tanggal DESC, p.id DESC LIMIT 200`;
  return (
    <>
      <PageHeader title="Pembelian Karung" desc="Catat pembelian karung dari pemasok dan lihat riwayatnya." action={<Link href="/pembelian/baru" className={btnPrimary}>Catat Pembelian</Link>} />
      <Notice sp={sp} />
      {rows.length === 0 ? <Empty text="Belum ada pembelian. Catat pembelian karung pertama untuk mulai." action={<Link href="/pembelian/baru" className={btnPrimary}>Catat Pembelian</Link>} /> : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-white">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <div className="font-medium">#{r.id} · {r.supplier ?? "Tanpa supplier"}</div>
                <div className="text-sm text-muted">{tgl(r.tgl)} · {r.jumlah_karung} karung{r.perkiraan_potong ? ` · ± ${r.perkiraan_potong} potong (${rp(r.biaya / r.perkiraan_potong)}/potong)` : ""}</div>
                {r.catatan && <div className="mt-1 text-xs text-muted">{r.catatan}</div>}
              </div>
              <div className="flex items-center gap-4"><span className="font-semibold">{rp(r.biaya)}</span><Link href={`/sortir/${r.id}`} className="text-sm font-semibold text-brand-hover hover:underline">Sortir</Link></div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
