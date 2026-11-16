"use server";
import { createHash } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { sql, type FormState } from "./db";
import { burnPasswordCheck, createSession, destroySession, hashPassword, verifyPassword } from "./auth";

const t = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOGIN_LIMIT = 10;
const REGISTER_LIMIT = 5;
const HARGA_AWAL: [string, number, string][] = [
  ["A", 50000, "Ber-merk, kondisi bagus, dijual tinggi"],
  ["B", 30000, "Kondisi baik, bahan biasa, dijual sedang"],
  ["C", 15000, "Bernoda atau robek, diobral"],
];

const safeNext = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "");
  return s.startsWith("/") && !s.startsWith("//") && !s.includes("\\") ? s : "/";
};

async function attemptKey(scope: string) {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") ?? "").split(",")[0]?.trim() || h.get("x-real-ip") || "lokal";
  return createHash("sha256").update(`${scope}|${ip}|${process.env.AUTH_RATE_SALT ?? ""}`).digest("hex");
}

async function isBlocked(key: string, limit: number) {
  const [row] = await sql`SELECT COUNT(*)::int AS n FROM login_attempts
    WHERE key = ${key} AND created_at > now() - interval '15 minutes'`;
  return row.n >= limit;
}

async function catatPercobaan(key: string) {
  await sql`DELETE FROM login_attempts WHERE created_at < now() - interval '1 day'`;
  await sql`INSERT INTO login_attempts (key) VALUES (${key})`;
}

export async function masuk(_: FormState, f: FormData): Promise<FormState> {
  const email = t(f.get("email")).toLowerCase();
  const password = String(f.get("password") ?? "");
  if (!EMAIL_RE.test(email) || !password) return { error: "Email dan kata sandi wajib diisi." };
  if (password.length > 200) return { error: "Email atau kata sandi salah." };

  const key = await attemptKey(`masuk:${email}`);
  if (await isBlocked(key, LOGIN_LIMIT)) {
    return { error: "Terlalu banyak percobaan masuk. Coba lagi dalam 15 menit." };
  }

  const [user] = await sql`SELECT id, password_hash FROM users WHERE email = ${email}`;
  if (!user) {
    await burnPasswordCheck(password);
    await catatPercobaan(key);
    return { error: "Email atau kata sandi salah." };
  }
  if (!(await verifyPassword(password, user.password_hash))) {
    await catatPercobaan(key);
    return { error: "Email atau kata sandi salah." };
  }

  await sql`DELETE FROM login_attempts WHERE key = ${key}`;
  await sql`DELETE FROM sessions WHERE expires_at < now()`;
  await createSession(user.id);
  redirect(safeNext(f.get("next")));
}

export async function daftar(_: FormState, f: FormData): Promise<FormState> {
  const nama = t(f.get("nama"));
  const email = t(f.get("email")).toLowerCase();
  const password = String(f.get("password") ?? "");

  if (nama.length < 2 || nama.length > 80) return { error: "Nama wajib diisi (2–80 karakter)." };
  if (!EMAIL_RE.test(email) || email.length > 254) return { error: "Alamat email tidak valid." };
  if (password.length < 8) return { error: "Kata sandi minimal 8 karakter." };
  if (password.length > 200) return { error: "Kata sandi terlalu panjang." };

  const key = await attemptKey("daftar");
  if (await isBlocked(key, REGISTER_LIMIT)) {
    return { error: "Terlalu banyak pendaftaran dari jaringan ini. Coba lagi nanti." };
  }
  await catatPercobaan(key);

  let userId: number;
  try {
    const [user] = await sql`INSERT INTO users (nama, email, password_hash)
      VALUES (${nama}, ${email}, ${await hashPassword(password)}) RETURNING id`;
    userId = user.id;
  } catch (e: any) {
    if (e?.code === "23505") return { error: "Email sudah terdaftar. Silakan masuk." };
    throw e;
  }

  for (const [grade, harga, keterangan] of HARGA_AWAL) {
    await sql`INSERT INTO grade_prices (user_id, grade, harga, keterangan)
      VALUES (${userId}, ${grade}, ${harga}, ${keterangan}) ON CONFLICT (user_id, grade) DO NOTHING`;
  }

  await sql`DELETE FROM sessions WHERE expires_at < now()`;
  await createSession(userId);
  redirect("/");
}

export async function keluar() {
  await destroySession();
  redirect("/login");
}
