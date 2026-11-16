import { sql } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui";
import { Simulator } from "@/components/simulator";

export default async function Simulasi() {
  const user = await requireUser();
  const gp = await sql`SELECT grade, harga FROM grade_prices WHERE user_id = ${user.id}`;
  const harga = Object.fromEntries(gp.map((g) => [g.grade, g.harga]));
  return (
    <>
      <PageHeader title="Simulasi Untung/Rugi" desc="Perkirakan hasil sebuah karung sebelum membelinya." />
      <Simulator harga={{ A: harga.A ?? 0, B: harga.B ?? 0, C: harga.C ?? 0 }} />
    </>
  );
}
