import Link from "next/link";
import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { rp, tgl } from "@/lib/format";
import { Badge, Empty, PageHeader, btnPrimary, btnSecondary } from "@/components/ui";

export default async function Beranda() {
  const user = await requireUser();
  const [[stok], [jual], aging, [cnt]] = await Promise.all([
    sql`SELECT COALESCE(SUM(jumlah),0)::int AS potong, COUNT(*) FILTER (WHERE jumlah>0)::int AS jenis FROM items WHERE user_id = ${user.id}`,
    sql`SELECT COALESCE(SUM(jumlah*harga_satuan),0)::float8 AS total, COALESCE(SUM(jumlah),0)::int AS potong FROM sales WHERE user_id = ${user.id} AND created_at >= date_trunc('month', now())`,
    sql`SELECT id, nama, grade, umur, status FROM v_items WHERE user_id = ${user.id} AND jumlah>0 AND status IN ('perlu_obral','perlu_diperiksa') ORDER BY umur DESC LIMIT 5`,
    sql`SELECT COUNT(*)::int AS n FROM v_items WHERE user_id = ${user.id} AND jumlah>0 AND status IN ('perlu_obral','perlu_diperiksa')`,
  ]);
  return (
    <>
      <PageHeader title="Beranda" desc={`Ringkasan kondisi toko per ${tgl(new Date())}.`} action={<Link href="/pembelian/baru" className={btnPrimary}>Catat Pembelian</Link>} />
      {stok.jenis === 0 ? (
        <Empty text="Belum ada barang. Catat pembelian karung pertama, lalu sortir untuk mulai mengelola stok." action={<Link href="/pembelian/baru" className={btnPrimary}>Catat Pembelian</Link>} />
      ) : (
        <dl className="grid divide-y divide-line rounded-xl border border-line bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {[
            ["Stok tersedia", `${stok.potong} potong`, `${stok.jenis} jenis barang`],
            ["Penjualan bulan ini", rp(jual.total), `${jual.potong} potong terjual`],
            ["Perlu perhatian", `${cnt.n} barang`, "Lama tersimpan"],
          ].map(([a, b, c]) => (
            <div key={a} className="p-5"><dt className="text-sm text-muted">{a}</dt><dd className="mt-1 text-2xl font-bold">{b}</dd><dd className="text-xs text-muted">{c}</dd></div>
          ))}
        </dl>
      )}

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-[17px] font-semibold lg:text-lg">Barang yang perlu diperiksa</h2>
          {cnt.n > 0 && <Link href="/aging" className="text-sm font-semibold text-brand-hover underline-offset-2 hover:underline">Lihat semua</Link>}
        </div>
        {aging.length === 0 ? <p className="text-muted">{cnt.n === 0 ? "Tidak ada barang yang melewati batas usia stok." : ""}</p> : (
          <ul className="divide-y divide-line rounded-xl border border-line bg-white">
            {aging.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div><Link href={`/stok/${r.id}`} className="font-medium hover:underline">{r.nama}</Link><p className="text-xs text-muted">Grade {r.grade} · tersimpan {r.umur} hari</p></div>
                <Badge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-[17px] font-semibold lg:text-lg">Pekerjaan yang sering dilakukan</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/sortir" className={btnSecondary}>Sortir & Barcode</Link>
          <Link href="/stok/baru" className={btnSecondary}>Tambah Barang</Link>
          <Link href="/simulasi" className={btnSecondary}>Simulasi Untung/Rugi</Link>
        </div>
      </section>
    </>
  );
}
