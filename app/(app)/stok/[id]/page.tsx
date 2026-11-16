import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { hapusBarang, jualBarang } from "@/lib/actions";
import { rp, tgl } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { Badge, Field, Notice, PageHeader, Thumb, btnDanger } from "@/components/ui";

export default async function DetailBarang({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  const [r] = Number(id) ? await sql`SELECT v.*, p.tanggal::text AS tgl_beli FROM v_items v
    LEFT JOIN purchases p ON p.id = v.purchase_id AND p.user_id = v.user_id
    WHERE v.id = ${Number(id)} AND v.user_id = ${user.id}` : [];
  if (!r) notFound();
  const rows: [string, React.ReactNode][] = [
    ["Barcode", r.barcode], ["Grade", r.grade], ["Harga normal", rp(r.harga)],
    ["Harga obral", r.harga_obral ? rp(r.harga_obral) : "Tidak sedang diobral"],
    ["Stok sekarang", `${r.jumlah} dari ${r.jumlah_awal} potong`], ["Lama tersimpan", `${r.umur} hari`],
    ["Asal pembelian", r.purchase_id ? `#${r.purchase_id} (${tgl(r.tgl_beli)})` : "Tanpa pembelian"],
  ];
  return (
    <>
      <PageHeader title={r.nama} desc="Detail barang dan pencatatan penjualan." crumbs={[["/stok", "Stok Barang"]]} />
      <Notice sp={sp} />
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <div className="mb-4 flex items-center gap-3"><Thumb url={r.foto_url} /><Badge status={r.status} /></div>
          <dl className="divide-y divide-line rounded-xl border border-line bg-white text-sm">
            {rows.map(([a, b]) => <div key={a} className="flex justify-between gap-4 px-4 py-3"><dt className="text-muted">{a}</dt><dd className="text-right font-medium">{b}</dd></div>)}
          </dl>
        </section>
        <section className="space-y-8">
          <div>
            <h2 className="mb-3 text-[17px] font-semibold lg:text-lg">Catat Penjualan</h2>
            {r.jumlah > 0 ? (
              <ActionForm action={jualBarang} submit="Catat Penjualan">
                <input type="hidden" name="item_id" value={r.id} />
                <Field label="Jumlah terjual" name="jumlah" defaultValue="1" inputMode="numeric" hint={`Dijual dengan harga ${rp(r.harga_jual)} per potong. Stok tersedia: ${r.jumlah}.`} />
              </ActionForm>
            ) : <p className="text-muted">Stok barang ini habis.</p>}
          </div>
          <details className="rounded-xl border border-line bg-white p-4">
            <summary className="min-h-6 cursor-pointer text-sm font-semibold text-bad">Hapus Barang</summary>
            <form action={hapusBarang} className="mt-3 space-y-3">
              <input type="hidden" name="id" value={r.id} />
              <p className="text-sm text-muted">Barang ini akan dihapus dari stok dan tidak bisa dikembalikan. Riwayat penjualan yang sudah tercatat tetap tersimpan.</p>
              <button className={btnDanger}>Ya, Hapus Barang</button>
            </form>
          </details>
        </section>
      </div>
    </>
  );
}
