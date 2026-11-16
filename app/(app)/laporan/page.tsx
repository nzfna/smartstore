import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { rp, tgl } from "@/lib/format";
import { Empty, PageHeader, btnSecondary, input } from "@/components/ui";

const bulanAktif = (v?: string) => (v && /^\d{4}-\d{2}$/.test(v) ? v : new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" }).slice(0, 7));

export default async function Laporan({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const bulan = bulanAktif(sp.bulan), mulai = `${bulan}-01`;
  const [rows, [beli]] = await Promise.all([
    sql`SELECT created_at, nama, jumlah, harga_satuan FROM sales WHERE user_id = ${user.id} AND created_at >= ${mulai}::date AND created_at < (${mulai}::date + interval '1 month') ORDER BY created_at DESC`,
    sql`SELECT COALESCE(SUM(biaya),0)::float8 AS total, COUNT(*)::int AS n FROM purchases WHERE user_id = ${user.id} AND tanggal >= ${mulai}::date AND tanggal < (${mulai}::date + interval '1 month')`,
  ]);
  const jual = rows.reduce((s, r) => s + r.jumlah * r.harga_satuan, 0);
  const potong = rows.reduce((s, r) => s + r.jumlah, 0);
  const selisih = jual - beli.total;
  return (
    <>
      <PageHeader title="Laporan" desc="Ringkasan penjualan dan pembelian pada satu bulan." action={<a className={btnSecondary} href={`/laporan/export?bulan=${bulan}`}>Unduh CSV</a>} />
      <form className="mb-5 flex max-w-sm gap-2">
        <input type="month" name="bulan" defaultValue={bulan} className={input} aria-label="Pilih bulan" />
        <button className={btnSecondary}>Tampilkan</button>
      </form>
      <dl className="grid divide-y divide-line rounded-xl border border-line bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {[["Penjualan", rp(jual), `${potong} potong terjual`], ["Pembelian karung", rp(beli.total), `${beli.n} pembelian`], ["Selisih", (selisih < 0 ? "-" : "") + rp(Math.abs(selisih)), "Penjualan dikurangi pembelian"]].map(([a, b, c]) => (
          <div key={a} className="p-5"><dt className="text-sm text-muted">{a}</dt><dd className="mt-1 text-2xl font-bold">{b}</dd><dd className="text-xs text-muted">{c}</dd></div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted">Selisih dihitung dari uang masuk dan keluar yang tercatat bulan ini, bukan laba bersih per karung. Sumber: penjualan dan pembelian yang dicatat di aplikasi. Diperbarui {tgl(new Date())}.</p>
      <h2 className="mb-3 mt-8 text-[17px] font-semibold lg:text-lg">Rincian penjualan</h2>
      {rows.length === 0 ? <Empty text="Belum ada penjualan pada bulan ini." /> : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-white text-sm">
          {rows.map((r, i) => (
            <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
              <div><div className="font-medium">{r.nama}</div><div className="text-xs text-muted">{tgl(r.created_at)} · {r.jumlah} × {rp(r.harga_satuan)}</div></div>
              <b>{rp(r.jumlah * r.harga_satuan)}</b>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
