import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { tambahSupplier } from "@/lib/actions";
import { rp } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { Empty, Field, Notice, PageHeader } from "@/components/ui";

export default async function Supplier({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const rows = await sql`SELECT s.id, s.nama, s.kontak, s.catatan,
    (SELECT COUNT(*) FROM purchases p WHERE p.supplier_id = s.id AND p.user_id = s.user_id)::int AS pembelian,
    (SELECT COALESCE(SUM(biaya),0) FROM purchases p WHERE p.supplier_id = s.id AND p.user_id = s.user_id AND p.sortir_selesai)::float8 AS biaya_selesai,
    (SELECT COALESCE(SUM(i.jumlah_awal),0) FROM items i JOIN purchases p ON p.id = i.purchase_id AND p.user_id = i.user_id WHERE p.supplier_id = s.id AND p.user_id = s.user_id AND p.sortir_selesai)::int AS potong,
    (SELECT COALESCE(SUM(i.jumlah_awal),0) FROM items i JOIN purchases p ON p.id = i.purchase_id AND p.user_id = i.user_id WHERE p.supplier_id = s.id AND p.user_id = s.user_id AND p.sortir_selesai AND i.grade = 'C')::int AS potong_c
    FROM suppliers s WHERE s.user_id = ${user.id} ORDER BY s.nama`;
  return (
    <>
      <PageHeader title="Supplier" desc="Simpan data pemasok dan bandingkan hasil karung dari tiap pemasok." />
      <Notice sp={sp} />
      <details className="mb-6 rounded-xl border border-line bg-white p-4" open={rows.length === 0}>
        <summary className="min-h-6 cursor-pointer text-sm font-semibold text-brand-hover">Tambah Supplier</summary>
        <div className="mt-4 max-w-xl">
          <ActionForm action={tambahSupplier} submit="Simpan Supplier">
            <Field label="Nama supplier" name="nama" required />
            <Field label="Kontak (opsional)" name="kontak" placeholder="Contoh: 0812-3456-7890" />
            <Field label="Catatan (opsional)" name="catatan" />
          </ActionForm>
        </div>
      </details>
      {rows.length === 0 ? <Empty text="Belum ada supplier. Tambahkan supplier pertama untuk mencatat asal karung." /> : (
        <ul className="divide-y divide-line rounded-xl border border-line bg-white">
          {rows.map((r) => (
            <li key={r.id} className="p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2"><span className="font-medium">{r.nama}</span><span className="text-sm text-muted">{r.pembelian} pembelian</span></div>
              {(r.kontak || r.catatan) && <p className="text-sm text-muted">{[r.kontak, r.catatan].filter(Boolean).join(" · ")}</p>}
              {r.potong > 0 && (
                <p className="mt-2 text-sm">Modal rata-rata <b>{rp(r.biaya_selesai / r.potong)}</b> per potong · Grade C <b>{Math.round((r.potong_c / r.potong) * 100)}%</b> dari {r.potong} potong</p>
              )}
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs text-muted">Angka dihitung dari pembelian yang sortirnya sudah selesai: biaya ÷ jumlah potong tercatat, dan porsi Grade C dari potong tercatat. Tidak ada skor otomatis.</p>
    </>
  );
}
