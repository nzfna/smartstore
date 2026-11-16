import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <Link href="/login" className="mb-6 block text-center">
          <div className="text-2xl font-bold text-brand">Thrift Mania</div>
          <div className="text-sm text-muted">SmartStore</div>
        </Link>
        <div className="rounded-xl border border-line bg-white p-5 shadow-sm sm:p-6">{children}</div>
        <p className="mt-4 text-center text-xs text-muted">Akses khusus pengelola toko.</p>
      </div>
    </div>
  );
}
