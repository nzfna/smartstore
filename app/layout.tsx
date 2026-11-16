import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Thrift Mania SmartStore", description: "Alat bantu operasional toko thrift." };
export const viewport: Viewport = { viewportFit: "cover", width: "device-width", initialScale: 1 };
const font = Plus_Jakarta_Sans({ subsets: ["latin"], variable: "--font-jakarta" });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={font.variable}>
      <body className="font-sans text-[15px] antialiased">{children}</body>
    </html>
  );
}
