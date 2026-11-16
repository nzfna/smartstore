import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { aturDiskon, tandaiDitinjau } from "@/lib/actions";
import { rp } from "@/lib/format";
import { Badge, Empty, Notice, PageHeader, Thumb, btnPrimary, btnSecondary, input } from "@/components/ui";

const group = (t: string, d: string) => ({ t, d });

export default async function Aging({ searchParams }: { searchParams: Promise<Record<string, string>> }) {
  const user = await requireUser();
  const sp = await searchParams;
  const [aging, obral] = await Promise.all([
    sql`SELECT * FROM v_items WHERE user_id = ${user.id} AND jumlah > 0 AND umur >= 30 AND status <> 'habis' ORDER BY umur DESC LIMIT 200`,
    sql`SELECT nama, grade, harga_jual FROM v_items WHERE user_id = ${user.id} AND jumlah > 0 AND status = 'diobral' ORDER BY nama`,
  ]);
  const sections = [
    { ...group("Perlu obral", "Tersimpan 60 hari atau lebih."), rows: aging.filter((r) => r.status === "perlu_obral") },
    { ...group("Perlu diperiksa", "Tersimpan 30–59 hari."), rows: aging.filter((r) => r.status === "perlu_diperiksa") },
    { ...group("Sudah ditindaklanjuti", "Sudah diobral atau ditandai selesai."), rows: aging.filter((r) => ["diobral", "ditinjau"].includes(r.status)) },
  ];
  const pesan = obral.length
    ? `Katalog obral Thrift Mania:\n` + obral.map((o) => `- ${o.nama} (Grade ${o.grade}): ${rp(o.harga_jual)}`).join("\n")
    : "";
  return (
    <>
      <PageHeader title="Aging Alert" desc="Periksa barang yang sudah lama tersimpan dan tentukan tindak lanjutnya." />
      <Notice sp={sp} />
      {aging.length === 0 && <Empty text="Tidak ada barang yang melewati batas usia stok (30 hari)." />}
      {sections.filter((s) => s.rows.length).map((s) => (
        <section key={s.t} className="mb-8">
          <h2 className="text-[17px] font-semibold lg:text-lg">{s.t} <span className="font-normal text-muted">({s.rows.length})</span></h2>
          <p className="mb-3 text-sm text-muted">{s.d}</p>
          <ul className="divide-y divide-line rounded-xl border border-line bg-white">
            {s.rows.map((r) => (
              <li key={r.id} className="space-y-3 p-4">
                <div className="flex items-center gap-3">
                  <Thumb url={r.foto_url} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{r.nama}</div>
                    <div className="text-sm text-muted">Grade {r.grade} · {r.jumlah} pcs · {rp(r.harga_jual)}{r.harga_obral ? ` (normal ${rp(r.harga)})` : ""}</div>
                    <div className="text-xs text-muted">Muncul karena tersimpan {r.umur} hari, melewati batas 30 hari.</div>
                  </div>
                  <Badge status={r.status} />
                </div>
                {["perlu_obral", "perlu_diperiksa"].includes(r.status) && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                    <form action={aturDiskon} className="flex flex-1 gap-2">
                      <input type="hidden" name="id" value={r.id} />
                      <input name="harga" inputMode="numeric" className={input} placeholder={`Harga obral, kurang dari ${rp(r.harga)}`} aria-label={`Harga obral ${r.nama}`} />
                      <button className={btnPrimary}>Atur Diskon</button>
                    </form>
                    <form action={tandaiDitinjau}><input type="hidden" name="id" value={r.id} /><button className={btnSecondary}>Tandai Sudah Ditindaklanjuti</button></form>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section className="mt-10 border-t border-line pt-6">
        <h2 className="text-[17px] font-semibold lg:text-lg">Katalog obral</h2>
        {obral.length === 0 ? <p className="mt-1 text-muted">Belum ada barang yang diobral. Atur diskon pada barang di atas.</p> : (
          <>
            <p className="mt-1 text-sm text-muted">Pesan berisi {obral.length} barang obral (nama, grade, harga obral). Tombol ini hanya membuka WhatsApp dengan pesan siap kirim. Pesan baru terkirim setelah kamu memilih penerima dan menekan kirim di WhatsApp.</p>
            <a className={`${btnPrimary} mt-3`} href={`https://wa.me/?text=${encodeURIComponent(pesan)}`} target="_blank" rel="noreferrer">Bagikan Katalog via WhatsApp</a>
          </>
        )}
      </section>
    </>
  );
}
