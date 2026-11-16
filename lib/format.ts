export const rp = (n: number) => "Rp" + Math.round(Number(n) || 0).toLocaleString("id-ID");
export const tgl = (d: Date | string) =>
  new Date(d).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });
export const hariIni = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Jakarta" });
export const parseAngka = (v: unknown) => Number(String(v ?? "").replace(/\D/g, "")) || 0;
