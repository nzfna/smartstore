import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum diisi di .env.local");
const sql = neon(process.env.DATABASE_URL);

const TABEL_DATA = ["suppliers", "purchases", "grade_prices", "items", "sales"];
const stmts = readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8")
  .split(/;\s*\n/).map((s) => s.trim()).filter(Boolean);
const run = (s) => sql.query(s);
const adaTabel = async (t) => (await sql`SELECT to_regclass(${`public.${t}`}) AS o`)[0]?.o != null;

// 1. Pastikan tabel akun sudah ada sebelum kolom user_id ditambahkan.
for (const s of stmts) {
  if (/CREATE (TABLE|INDEX) IF NOT EXISTS (users|sessions|login_attempts)\b/.test(s)) await run(s);
}

// 2. Database lama: tambahkan kolom pemilik tanpa menghapus data.
for (const t of TABEL_DATA) {
  if (await adaTabel(t)) {
    await run(`ALTER TABLE ${t} ADD COLUMN IF NOT EXISTS user_id int REFERENCES users(id) ON DELETE CASCADE`);
  }
}

// 3. Jalankan skema idempoten (membuat tabel/indeks/view yang belum ada).
for (const s of stmts) await run(s);

// 4. Data lama diberikan ke akun paling awal (pendaftar pertama).
const [pertama] = await sql`SELECT id FROM users ORDER BY id LIMIT 1`;
if (pertama) {
  for (const t of TABEL_DATA) {
    await sql.query(`UPDATE ${t} SET user_id = ${pertama.id} WHERE user_id IS NULL`);
  }
}

// 5. Kunci pemilik setelah semua baris punya user_id.
for (const t of TABEL_DATA) {
  const [sisa] = await sql.query(`SELECT COUNT(*)::int AS n FROM ${t} WHERE user_id IS NULL`);
  if (sisa.n === 0) await run(`ALTER TABLE ${t} ALTER COLUMN user_id SET NOT NULL`);
}

// 6. Barcode unik per akun, bukan global.
const unik = await sql`SELECT conname, pg_get_constraintdef(oid) AS def
  FROM pg_constraint WHERE conrelid = 'items'::regclass AND contype = 'u'`;
for (const u of unik) {
  if (u.def.includes("(barcode)") && !u.def.includes("user_id")) {
    await run(`ALTER TABLE items DROP CONSTRAINT "${u.conname}"`);
  }
}
await run("CREATE UNIQUE INDEX IF NOT EXISTS items_user_id_barcode_key ON items (user_id, barcode)");

// 7. grade_prices: ganti primary key (grade) menjadi (user_id, grade).
const [gradeTanpaPemilik] = await sql`SELECT COUNT(*)::int AS n FROM grade_prices WHERE user_id IS NULL`;
if (gradeTanpaPemilik.n === 0) {
  const pk = await sql`SELECT conname, pg_get_constraintdef(oid) AS def
    FROM pg_constraint WHERE conrelid = 'grade_prices'::regclass AND contype = 'p'`;
  if (pk.length && !pk.some((r) => r.def.includes("user_id"))) {
    await run(`ALTER TABLE grade_prices DROP CONSTRAINT "${pk[0].conname}"`);
  }
  const pkBaru = await sql`SELECT 1 FROM pg_constraint
    WHERE conrelid = 'grade_prices'::regclass AND contype = 'p'`;
  if (!pkBaru.length) await run("ALTER TABLE grade_prices ADD PRIMARY KEY (user_id, grade)");
}

// 8. Setiap akun punya harga grade awal sendiri.
await sql`INSERT INTO grade_prices (user_id, grade, harga, keterangan)
  SELECT u.id, v.grade, v.harga, v.keterangan
  FROM users u
  CROSS JOIN (VALUES
    ('A', 50000, 'Ber-merk, kondisi bagus, dijual tinggi'),
    ('B', 30000, 'Kondisi baik, bahan biasa, dijual sedang'),
    ('C', 15000, 'Bernoda atau robek, diobral')
  ) AS v(grade, harga, keterangan)
  ON CONFLICT (user_id, grade) DO NOTHING`;

console.log(`Selesai: ${stmts.length} perintah skema + migrasi data per akun dijalankan.`);
