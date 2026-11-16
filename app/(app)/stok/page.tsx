import Link from "next/link";
import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { rp } from "@/lib/format";
import { Badge, Empty, Notice, PageHeader, STATUS, Thumb, btnPrimary, btnSecondary, input } from "@/components/ui";

export default async function Stok({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const q = sp.q ?? "", g = sp.grade ?? "", s = sp.status ?? "";
  const rows = await sql`SELECT * FROM v_items
    WHERE user_id = ${user.id}
      AND (${q}::text = '' OR nama ILIKE ${"%" + q + "%"} OR barcode ILIKE ${"%" + q + "%"})
      AND (${g}::text = '' OR grade = ${g}) AND (${s}::text = '' OR status = ${s})
    ORDER BY created_at DESC LIMIT 200`;
  const filtered = !!(q || g || s);
  return (
    <>
      <PageHeader title="Stok Barang" desc="Lihat dan kelola barang yang tersedia di toko." action={<Link href="/stok/baru" className={btnPrimary}>Tambah Barang</Link>} />
      <Notice sp={sp} />
      <form className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
        <input name="q" defaultValue={q} className={input} placeholder="Cari nama atau barcode" aria-label="Cari nama atau barcode" />
        <select name="grade" defaultValue={g} className={input} aria-label="Filter grade"><option value="">Semua grade</option>{["A", "B", "C"].map((x) => <option key={x} value={x}>Grade {x}</option>)}</select>
        <select name="status" defaultValue={s} className={input} aria-label="Filter status"><option value="">Semua status</option>{Object.entries(STATUS).filter(([k]) => !["belum", "proses", "selesai"].includes(k)).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select>
        <button className={btnSecondary}>Terapkan</button>
      </form>
      {rows.length === 0 ? (
        <Empty text={filtered ? "Tidak ada barang yang cocok. Ubah kata kunci atau filter." : "Belum ada barang. Tambahkan barang pertama untuk mulai mengelola stok."} action={!filtered && <Link href="/stok/baru" className={btnPrimary}>Tambah Barang</Link>} />
      ) : (
        <>
          <table className="hidden w-full overflow-hidden rounded-xl border border-line bg-white text-sm md:table">
            <thead className="border-b border-line bg-page text-left text-xs text-muted"><tr><th className="p-3">Barang</th><th>Grade</th><th>Harga</th><th>Jumlah</th><th>Status</th><th /></tr></thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="p-3"><div className="flex items-center gap-3"><Thumb url={r.foto_url} /><div><div className="font-medium">{r.nama}</div><div className="text-xs text-muted">{r.barcode}</div></div></div></td>
                  <td>{r.grade}</td>
                  <td>{rp(r.harga_jual)}{r.harga_obral && <span className="ml-1 text-xs text-muted line-through">{rp(r.harga)}</span>}</td>
                  <td>{r.jumlah}</td><td><Badge status={r.status} /></td>
                  <td className="pr-3 text-right"><Link href={`/stok/${r.id}`} className="font-semibold text-brand-hover hover:underline">Lihat</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
          <ul className="divide-y divide-line rounded-xl border border-line bg-white md:hidden">
            {rows.map((r) => (
              <li key={r.id}>
                <Link href={`/stok/${r.id}`} className="flex items-center gap-3 p-3">
                  <Thumb url={r.foto_url} />
                  <div className="min-w-0 flex-1"><div className="truncate font-medium">{r.nama}</div><div className="text-xs text-muted">Grade {r.grade} · {rp(r.harga_jual)} · {r.jumlah} pcs</div></div>
                  <Badge status={r.status} />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
