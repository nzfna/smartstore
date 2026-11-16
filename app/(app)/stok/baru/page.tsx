import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { simpanItem } from "@/lib/actions";
import { ActionForm } from "@/components/action-form";
import { Field, PageHeader, SelectField } from "@/components/ui";

export default async function TambahBarang() {
  const user = await requireUser();
  const buys = await sql`SELECT p.id, p.tanggal::text AS tanggal, s.nama AS supplier FROM purchases p
    LEFT JOIN suppliers s ON s.id = p.supplier_id AND s.user_id = p.user_id
    WHERE p.user_id = ${user.id} ORDER BY p.id DESC LIMIT 50`;
  return (
    <>
      <PageHeader title="Tambah Barang" desc="Catat satu barang langsung ke stok. Untuk banyak barang dari satu karung, gunakan Sortir & Barcode." crumbs={[["/stok", "Stok Barang"]]} />
      <div className="max-w-xl">
        <ActionForm action={simpanItem} submit="Simpan Barang" cancelHref="/stok">
          <Field label="Nama barang" name="nama" placeholder="Contoh: Jaket denim pria" required />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Grade" name="grade" defaultValue=""><option value="" disabled>Pilih grade</option>{["A", "B", "C"].map((g) => <option key={g} value={g}>Grade {g}</option>)}</SelectField>
            <Field label="Jumlah" name="jumlah" defaultValue="1" inputMode="numeric" />
          </div>
          <Field label="Harga jual (Rp)" name="harga" inputMode="numeric" placeholder="Kosongkan untuk memakai harga grade" hint="Contoh: 45.000" />
          <Field label="Barcode" name="barcode" placeholder="Kosongkan untuk dibuatkan otomatis" hint="Contoh: TM-0-001" />
          <SelectField label="Asal pembelian (opsional)" name="purchase_id" defaultValue=""><option value="">Tanpa pembelian</option>{buys.map((b) => <option key={b.id} value={b.id}>#{b.id} · {b.tanggal} · {b.supplier ?? "Tanpa supplier"}</option>)}</SelectField>
          <Field label="Alamat foto (opsional)" name="foto_url" type="url" placeholder="https://…" />
        </ActionForm>
      </div>
    </>
  );
}
