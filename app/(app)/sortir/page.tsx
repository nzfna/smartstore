import Link from "next/link";
import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { tgl } from "@/lib/format";
import { Badge, Empty, Notice, PageHeader, btnPrimary } from "@/components/ui";

export default async function Sortir({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const rows = await sql`SELECT p.id, p.tanggal::text AS tgl, p.perkiraan_potong, p.sortir_selesai, s.nama AS supplier,
      COALESCE((SELECT SUM(jumlah_awal) FROM items i WHERE i.purchase_id = p.id AND i.user_id = p.user_id), 0)::int AS tercatat
    FROM purchases p LEFT JOIN suppliers s ON s.id = p.supplier_id AND s.user_id = p.user_id
    WHERE p.user_id = ${user.id} ORDER BY p.sortir_selesai, p.id DESC LIMIT 100`;
  return (
    <>
      <PageHeader title="Sortir & Barcode" desc="Pilih karung, tetapkan grade tiap barang, lalu simpan barcodenya." />
      <Notice sp={sp} />
      {rows.length === 0 ? <Empty text="Belum ada karung untuk disortir. Catat pembelian karung dulu." action={<Link href="/pembelian/baru" className={btnPrimary}>Catat Pembelian</Link>} /> : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-white">
          {rows.map((r) => {
            const st = r.sortir_selesai ? "selesai" : r.tercatat > 0 ? "proses" : "belum";
            return (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <div className="font-medium">Pembelian #{r.id} · {r.supplier ?? "Tanpa supplier"}</div>
                  <div className="text-sm text-muted">{tgl(r.tgl)} · {r.tercatat} potong tercatat{r.perkiraan_potong ? ` dari ± ${r.perkiraan_potong}` : ""}</div>
                </div>
                <div className="flex items-center gap-3"><Badge status={st} /><Link href={`/sortir/${r.id}`} className="text-sm font-semibold text-brand-hover hover:underline">{r.sortir_selesai ? "Lihat" : "Sortir"}</Link></div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
