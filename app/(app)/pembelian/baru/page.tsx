import Link from "next/link";
import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { catatPembelian } from "@/lib/actions";
import { hariIni } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { Field, PageHeader, SelectField } from "@/components/ui";

export default async function CatatPembelian() {
  const user = await requireUser();
  const sup = await sql`SELECT id, nama FROM suppliers WHERE user_id = ${user.id} ORDER BY nama`;
  return (
    <>
      <PageHeader title="Catat Pembelian" desc="Isi data pembelian karung dari pemasok." crumbs={[["/pembelian", "Pembelian Karung"]]} />
      <div className="max-w-xl">
        <ActionForm action={catatPembelian} submit="Catat Pembelian" cancelHref="/pembelian">
          <div>
            <SelectField label="Supplier" name="supplier_id" defaultValue=""><option value="">Tanpa supplier</option>{sup.map((s) => <option key={s.id} value={s.id}>{s.nama}</option>)}</SelectField>
            {sup.length === 0 && <p className="mt-1 text-xs text-muted">Belum ada supplier. <Link href="/supplier" className="underline">Tambah supplier</Link> dulu bila perlu.</p>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tanggal beli" name="tanggal" type="date" defaultValue={hariIni()} />
            <Field label="Jumlah karung" name="jumlah_karung" defaultValue="1" inputMode="numeric" />
          </div>
          <Field label="Biaya pembelian (Rp)" name="biaya" inputMode="numeric" placeholder="6.500.000" hint="Total yang dibayar untuk semua karung." />
          <Field label="Perkiraan jumlah potong" name="perkiraan_potong" inputMode="numeric" placeholder="150" hint="Boleh perkiraan. Dipakai untuk menghitung modal per potong." />
          <Field label="Catatan (opsional)" name="catatan" placeholder="Contoh: karung jaket pria" />
        </ActionForm>
      </div>
    </>
  );
}
