import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { masuk } from "@/lib/auth-actions";
import { AuthForm } from "@/components/auth-form";
import { Field } from "@/components/ui";

export default async function Masuk({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  if (await getCurrentUser()) redirect("/");
  const { next } = await searchParams;

  return (
    <>
      <h1 className="text-xl font-bold">Masuk</h1>
      <p className="mb-5 mt-1 text-sm text-muted">Gunakan email dan kata sandi akun Anda.</p>
      <AuthForm action={masuk} submit="Masuk" altText="Belum punya akun?" altHref="/register" altLabel="Daftar">
        <input type="hidden" name="next" value={next ?? ""} />
        <Field label="Email" name="email" type="email" autoComplete="email" placeholder="nama@contoh.com" required />
        <Field label="Kata sandi" name="password" type="password" autoComplete="current-password" required />
      </AuthForm>
    </>
  );
}
