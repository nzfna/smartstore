import { notFound } from "next/navigation";
import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { selesaikanSortir, simpanItem } from "@/lib/actions";
import { rp, tgl } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { Badge, Field, Notice, PageHeader, SelectField, btnSecondary } from "@/components/ui";

export default async function SortirKarung({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser();
  const { id } = await params;
  const sp = await searchParams;
  const pid = Number(id);
  const [p] = pid ? await sql`SELECT p.*, p.tanggal::text AS tgl, s.nama AS supplier FROM purchases p
    LEFT JOIN suppliers s ON s.id = p.supplier_id AND s.user_id = p.user_id
    WHERE p.id = ${pid} AND p.user_id = ${user.id}` : [];
  if (!p) notFound();
  const items = await sql`SELECT id, nama, barcode, grade, harga, jumlah_awal FROM items
    WHERE purchase_id = ${pid} AND user_id = ${user.id} ORDER BY id`;
  const per: Record<string, number> = { A: 0, B: 0, C: 0 };
  items.forEach((i) => (per[i.grade] += i.jumlah_awal));
  const total = items.reduce((s, i) => s + i.jumlah_awal, 0);
  const step = p.sortir_selesai ? 3 : total > 0 ? 2 : 1;
  return (
    <>
      <PageHeader title={`Sortir Pembelian #${p.id}`} desc={`${p.supplier ?? "Tanpa supplier"} · ${tgl(p.tgl)} · ${rp(p.biaya)}`} crumbs={[["/sortir", "Sortir & Barcode"]]} action={<Badge status={p.sortir_selesai ? "selesai" : total ? "proses" : "belum"} />} />
      <Notice sp={sp} />
      <ol className="mb-6 flex flex-wrap gap-x-6 gap-y-1 text-sm" aria-label="Langkah sortir">
        {["Pilih karung", "Sortir & tetapkan grade", "Selesaikan sortir"].map((l, i) => (
          <li key={l} aria-current={step === i + 1 ? "step" : undefined} className={step >= i + 1 ? "font-semibold text-ink" : "text-muted"}>{i + 1}. {l}{step > i + 1 ? " (selesai)" : ""}</li>
        ))}
      </ol>
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-[17px] font-semibold lg:text-lg">Tambah hasil sortir</h2>
          <ActionForm action={simpanItem} submit="Simpan Barang">
            <input type="hidden" name="purchase_id" value={p.id} />
            <input type="hidden" name="lanjut" value="1" />
            <Field label="Nama barang" name="nama" placeholder="Contoh: Jaket denim pria" required />
            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField label="Grade" name="grade" defaultValue=""><option value="" disabled>Pilih grade</option>{["A", "B", "C"].map((g) => <option key={g} value={g}>Grade {g}</option>)}</SelectField>
              <Field label="Jumlah potong" name="jumlah" defaultValue="1" inputMode="numeric" />
            </div>
            <Field label="Barcode" name="barcode" placeholder="Kosongkan untuk dibuatkan otomatis" hint={`Contoh: TM-${p.id}-001`} />
            <Field label="Harga jual (Rp)" name="harga" inputMode="numeric" placeholder="Kosongkan untuk memakai harga grade" />
            <Field label="Alamat foto (opsional)" name="foto_url" type="url" placeholder="https://…" />
          </ActionForm>
        </section>
        <section>
          <h2 className="mb-3 text-[17px] font-semibold lg:text-lg">Ringkasan hasil</h2>
          <p className="mb-3 text-sm text-muted">{total} potong tercatat{p.perkiraan_potong ? ` dari perkiraan ${p.perkiraan_potong}` : ""} · A: {per.A} · B: {per.B} · C: {per.C}</p>
          {items.length === 0 ? <p className="text-muted">Belum ada barang untuk karung ini. Isi formulir di samping untuk mulai.</p> : (
            <ul className="divide-y divide-line rounded-xl border border-line bg-white text-sm">
              {items.map((i) => (
                <li key={i.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <div><div className="font-medium">{i.nama}</div><div className="text-xs text-muted">{i.barcode} · {i.jumlah_awal} pcs</div></div>
                  <div className="text-right"><div>Grade {i.grade}</div><div className="text-xs text-muted">{rp(i.harga)}</div></div>
                </li>
              ))}
            </ul>
          )}
          {!p.sortir_selesai && total > 0 && (
            <form action={selesaikanSortir} className="mt-4">
              <input type="hidden" name="id" value={p.id} />
              <button className={btnSecondary}>Selesaikan Sortir</button>
              <p className="mt-1 text-xs text-muted">Tandai karung ini selesai disortir. Barang yang tersimpan sudah ada di Stok Barang.</p>
            </form>
          )}
        </section>
      </div>
    </>
  );
}
