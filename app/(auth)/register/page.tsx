import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { daftar } from "@/lib/auth-actions";
import { AuthForm } from "@/components/auth-form";
import { Field } from "@/components/ui";

export default async function Daftar() {
  if (await getCurrentUser()) redirect("/");

  return (
    <>
      <h1 className="text-xl font-bold">Daftar akun</h1>
      <p className="mb-5 mt-1 text-sm text-muted">Langsung bisa dipakai, tanpa verifikasi email.</p>
      <AuthForm action={daftar} submit="Daftar & Masuk" altText="Sudah punya akun?" altHref="/login" altLabel="Masuk">
        <Field label="Nama" name="nama" autoComplete="name" placeholder="Nama Anda" required minLength={2} maxLength={80} />
        <Field label="Email" name="email" type="email" autoComplete="email" placeholder="nama@contoh.com" required />
        <Field label="Kata sandi" name="password" type="password" autoComplete="new-password" required minLength={8} hint="Minimal 8 karakter." />
      </AuthForm>
    </>
  );
}
