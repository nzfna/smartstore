# Thrift Mania SmartStore

Next.js 15 (App Router) + Tailwind v4 + Neon Postgres. Desain mengikuti `Thrift_Mania_UI_UX_Design_System.md`.

## Menjalankan lokal
1. Buat project di https://neon.tech, salin connection string.
2. `cp .env.example .env.local` lalu isi `DATABASE_URL`.
3. `npm install`
4. `npm run db:migrate` (membuat tabel, akun, sesi, dan data awal per akun)
5. `npm run dev` lalu buka http://localhost:3000

## Login & daftar
- Buka `/register` untuk membuat akun pertama. Tidak ada verifikasi email/OTP: akun langsung aktif dan otomatis masuk.
- Setelah itu gunakan `/login`. Sesi berlaku 30 hari dan bisa diakhiri lewat tombol **Keluar**.
- Kata sandi disimpan sebagai hash scrypt bersalt. Token sesi acak disimpan sebagai hash di database, dikirim lewat cookie `httpOnly` + `SameSite=Lax` (dan `Secure` di produksi).
- Semua halaman, server action, dan unduhan CSV memeriksa sesi. Percobaan login dibatasi 10 kali per 15 menit per email+IP, pendaftaran 5 kali per 15 menit per IP.
- Pendaftaran terbuka untuk siapa pun yang tahu URL. Jika toko hanya untuk staf tertentu, tambahkan kode undangan atau pembatasan domain email.

## Data terpisah per akun
- Setiap akun punya data sendiri: supplier, pembelian, barang, penjualan, dan harga grade tidak terlihat oleh akun lain.
- Semua query dan server action memfilter `user_id`; membuka ID milik akun lain menghasilkan 404.
- Barcode unik per akun, jadi akun berbeda boleh memakai barcode yang sama.
- Akun baru otomatis mendapat harga grade awal sendiri (A 50.000, B 30.000, C 15.000 — contoh, bisa diubah).
- Saat migrasi dari versi lama, seluruh data yang belum punya pemilik diberikan ke akun yang mendaftar paling awal.

## Deploy ke Vercel
1. Push ke GitHub, lalu Import di Vercel.
2. Tambahkan environment variable `DATABASE_URL` (connection string Neon yang sama).
3. Deploy. Migrasi cukup dijalankan sekali dari lokal ke database yang sama.
4. Opsional: isi `AUTH_RATE_SALT` dengan teks acak agar kunci pembatas percobaan login tidak bisa ditebak.

## Catatan
- Database mulai kosong (tanpa data contoh). Harga grade awal (A 50.000, B 30.000, C 15.000) hanya nilai contoh per akun, ubah di Harga per Grade.
- Batas aging (30 dan 60 hari) ada di view `v_items` pada `db/schema.sql`.
- Barcode disimpan sebagai teks. Pencetakan dan pemindaian barcode belum ada.
- Seluruh query memakai parameter (aman dari SQL injection). Header keamanan dasar (anti-clickjacking, nosniff, referrer policy) dipasang di `next.config.mjs`.
