import { sql } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const v = new URL(req.url).searchParams.get("bulan") ?? "";
  const bulan = /^\d{4}-\d{2}$/.test(v) ? v : new Date().toISOString().slice(0, 7);
  const mulai = `${bulan}-01`;
  const rows = await sql`SELECT created_at, nama, jumlah, harga_satuan FROM sales WHERE user_id = ${user.id} AND created_at >= ${mulai}::date AND created_at < (${mulai}::date + interval '1 month') ORDER BY created_at`;

  // Cegah CSV formula injection: sel yang diawali = + - @ diberi kutip awal.
  const esc = (s: unknown) => {
    let v = String(s ?? "");
    if (/^[=+\-@\t\r]/.test(v)) v = `'${v}`;
    return `"${v.replace(/"/g, '""')}"`;
  };
  const csv = ["Tanggal,Barang,Jumlah,Harga satuan,Total", ...rows.map((r) => [new Date(r.created_at).toISOString().slice(0, 10), esc(r.nama), r.jumlah, r.harga_satuan, r.jumlah * r.harga_satuan].join(","))].join("\n");
  return new Response(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="laporan-${bulan}.csv"` } });
}
