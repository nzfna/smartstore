import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { ubahHarga } from "@/lib/actions";
import { rp } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { Field, Notice, PageHeader } from "@/components/ui";

export default async function Harga({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const [gp, cnt] = await Promise.all([
    sql`SELECT grade, harga, keterangan FROM grade_prices WHERE user_id = ${user.id} ORDER BY grade`,
    sql`SELECT grade, COUNT(*)::int AS n FROM items WHERE user_id = ${user.id} AND jumlah > 0 GROUP BY grade`,
  ]);
  const n = (g: string) => cnt.find((c) => c.grade === g)?.n ?? 0;
  const total = gp.reduce((s, g) => s + n(g.grade), 0);
  return (
    <>
      <PageHeader title="Harga per Grade" desc="Atur harga jual standar untuk tiap grade barang." />
      <Notice sp={sp} />
      <div className="grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3 text-[17px] font-semibold lg:text-lg">Arti grade di tokomu</h2>
          <dl className="divide-y divide-line rounded-xl border border-line bg-white text-sm">
            {gp.map((g) => (
              <div key={g.grade} className="flex items-center justify-between gap-4 px-4 py-3">
                <div><dt className="font-medium">Grade {g.grade}</dt><dd className="text-muted">{g.keterangan}</dd></div>
                <dd className="font-semibold">{rp(g.harga)}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-xs text-muted">Nilai awal hanya contoh. Ubah sesuai harga yang kamu pakai.</p>
        </section>
        <section>
          <h2 className="mb-3 text-[17px] font-semibold lg:text-lg">Ubah harga</h2>
          <ActionForm action={ubahHarga} submit="Simpan Harga">
            {gp.map((g) => <Field key={g.grade} label={`Harga Grade ${g.grade} (Rp)`} name={g.grade} defaultValue={String(g.harga)} inputMode="numeric" hint={`${n(g.grade)} barang tersedia dengan grade ini.`} />)}
            <label className="flex min-h-11 items-start gap-3 text-sm">
              <input type="checkbox" name="terapkan" className="mt-1 size-4 accent-brand" />
              <span>Terapkan juga ke {total} barang yang masih tersedia. Jika tidak dicentang, harga baru hanya berlaku untuk barang yang disortir berikutnya.</span>
            </label>
          </ActionForm>
        </section>
      </div>
    </>
  );
}
