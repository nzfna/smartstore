"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql, type FormState } from "./db";
import { parseAngka as n } from "./format";
import { requireUser } from "./auth";

const t = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const vals = (f: FormData) => {
  const o: Record<string, string> = {};
  f.forEach((v, k) => { if (typeof v === "string") o[k] = v; });
  return o;
};
const fail = (f: FormData, error: string): FormState => ({ error, values: vals(f) });
const go = (path: string, msg: string, key = "ok"): never => redirect(`${path}?${key}=${encodeURIComponent(msg)}`);
const rv = () => revalidatePath("/", "layout");

export async function tambahSupplier(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
  const nama = t(f.get("nama"));
  if (!nama) return fail(f, "Nama supplier wajib diisi.");
  await sql`INSERT INTO suppliers (user_id, nama, kontak, catatan) VALUES (${user.id}, ${nama}, ${t(f.get("kontak")) || null}, ${t(f.get("catatan")) || null})`;
  rv();
  return go("/supplier", "Supplier berhasil disimpan.");
}

export async function catatPembelian(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
  const tanggal = t(f.get("tanggal"));
  const karung = n(f.get("jumlah_karung"));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(tanggal)) return fail(f, "Isi tanggal pembelian.");
  if (karung < 1) return fail(f, "Jumlah karung minimal 1.");
  if (n(f.get("biaya")) < 1) return fail(f, "Isi biaya pembelian, contoh: 6.500.000.");
  const sid = n(f.get("supplier_id")) || null;
  if (sid) {
    const [s] = await sql`SELECT 1 FROM suppliers WHERE id = ${sid} AND user_id = ${user.id}`;
    if (!s) return fail(f, "Supplier tidak ditemukan di akun ini.");
  }
  const [p] = await sql`INSERT INTO purchases (user_id, supplier_id, tanggal, jumlah_karung, biaya, perkiraan_potong, catatan)
    VALUES (${user.id}, ${sid}::int, ${tanggal}::date, ${karung}, ${n(f.get("biaya"))}, ${n(f.get("perkiraan_potong"))}, ${t(f.get("catatan")) || null}) RETURNING id`;
  rv();
  return go("/pembelian", `Pembelian #${p.id} berhasil dicatat. Lanjutkan ke Sortir & Barcode.`);
}

export async function simpanItem(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
  const nama = t(f.get("nama")), grade = t(f.get("grade")), jumlah = n(f.get("jumlah"));
  const pid = n(f.get("purchase_id")) || null;
  if (!nama) return fail(f, "Nama barang wajib diisi.");
  if (!["A", "B", "C"].includes(grade)) return fail(f, "Pilih grade barang.");
  if (jumlah < 1) return fail(f, "Jumlah minimal 1.");
  const foto = t(f.get("foto_url"));
  if (foto && !/^https?:\/\//i.test(foto)) return fail(f, "Alamat foto harus diawali http:// atau https://.");
  if (pid) {
    const [p] = await sql`SELECT 1 FROM purchases WHERE id = ${pid} AND user_id = ${user.id}`;
    if (!p) return fail(f, "Pembelian tidak ditemukan di akun ini.");
  }
  let harga = n(f.get("harga"));
  if (!harga) { const [g] = await sql`SELECT harga FROM grade_prices WHERE user_id = ${user.id} AND grade = ${grade}`; harga = g?.harga ?? 0; }
  let barcode = t(f.get("barcode"));
  if (!barcode) {
    const [c] = await sql`SELECT COUNT(*)::int AS n FROM items WHERE user_id = ${user.id} AND purchase_id IS NOT DISTINCT FROM ${pid}::int`;
    barcode = `TM-${pid ?? 0}-${String(c.n + 1).padStart(3, "0")}`;
  }
  try {
    await sql`INSERT INTO items (user_id, purchase_id, nama, barcode, grade, harga, jumlah, jumlah_awal, foto_url)
      VALUES (${user.id}, ${pid}::int, ${nama}, ${barcode}, ${grade}, ${harga}, ${jumlah}, ${jumlah}, ${foto || null})`;
  } catch (e: any) {
    if (e?.code === "23505") return fail(f, `Barcode ${barcode} sudah dipakai barang lain di akun ini. Isi barcode yang berbeda.`);
    throw e;
  }
  rv();
  if (f.get("lanjut") === "1") return { ok: `${nama} berhasil disimpan. Lanjutkan ke barang berikutnya.` };
  return go("/stok", "Barang berhasil disimpan.");
}

export async function selesaikanSortir(f: FormData) {
  const user = await requireUser();
  await sql`UPDATE purchases SET sortir_selesai = true WHERE id = ${n(f.get("id"))} AND user_id = ${user.id}`;
  rv();
  go("/sortir", "Sortir selesai. Barang sudah masuk Stok Barang.");
}

export async function jualBarang(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
  const id = n(f.get("item_id")), jml = n(f.get("jumlah"));
  if (jml < 1) return fail(f, "Jumlah terjual minimal 1.");
  const r = await sql`UPDATE items SET jumlah = jumlah - ${jml} WHERE id = ${id} AND user_id = ${user.id} AND jumlah >= ${jml}
    RETURNING nama, COALESCE(harga_obral, harga) AS harga`;
  if (!r.length) return fail(f, "Jumlah melebihi stok yang tersedia.");
  await sql`INSERT INTO sales (user_id, item_id, nama, jumlah, harga_satuan) VALUES (${user.id}, ${id}, ${r[0].nama}, ${jml}, ${r[0].harga})`;
  rv();
  return { ok: "Penjualan berhasil dicatat." };
}

export async function ubahHarga(_: FormState, f: FormData): Promise<FormState> {
  const user = await requireUser();
  const h: Record<string, number> = { A: n(f.get("A")), B: n(f.get("B")), C: n(f.get("C")) };
  if (Object.values(h).some((v) => v < 1)) return fail(f, "Harga semua grade harus diisi.");
  for (const g of ["A", "B", "C"]) {
    await sql`UPDATE grade_prices SET harga = ${h[g]} WHERE user_id = ${user.id} AND grade = ${g}`;
    if (f.get("terapkan") === "on") await sql`UPDATE items SET harga = ${h[g]} WHERE user_id = ${user.id} AND grade = ${g} AND jumlah > 0`;
  }
  rv();
  return go("/harga", "Harga per grade berhasil disimpan.");
}

export async function aturDiskon(f: FormData) {
  const user = await requireUser();
  const id = n(f.get("id")), harga = n(f.get("harga"));
  const [it] = await sql`SELECT harga FROM items WHERE id = ${id} AND user_id = ${user.id}`;
  if (!it || harga < 1 || harga >= it.harga) go("/aging", `Harga obral harus diisi dan lebih rendah dari harga normal (Rp${it?.harga ?? 0}).`, "err");
  await sql`UPDATE items SET harga_obral = ${harga} WHERE id = ${id} AND user_id = ${user.id}`;
  rv();
  go("/aging", "Harga obral disimpan. Barang masuk katalog obral.");
}

export async function tandaiDitinjau(f: FormData) {
  const user = await requireUser();
  await sql`UPDATE items SET ditinjau = true WHERE id = ${n(f.get("id"))} AND user_id = ${user.id}`;
  rv();
  go("/aging", "Barang ditandai sudah ditindaklanjuti.");
}

export async function hapusBarang(f: FormData) {
  const user = await requireUser();
  await sql`DELETE FROM items WHERE id = ${n(f.get("id"))} AND user_id = ${user.id}`;
  rv();
  go("/stok", "Barang dihapus. Riwayat penjualannya tetap tersimpan.");
}
