-- Akun dan sesi (dibuat lebih dulu karena semua data milik akun)
CREATE TABLE IF NOT EXISTS users (
  id serial PRIMARY KEY,
  nama text NOT NULL,
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS sessions (
  token_hash text PRIMARY KEY,
  user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);
CREATE TABLE IF NOT EXISTS login_attempts (
  id bigserial PRIMARY KEY,
  key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS login_attempts_key_idx ON login_attempts (key, created_at);

-- Data toko. Semua baris dipisah per akun lewat user_id.
CREATE TABLE IF NOT EXISTS suppliers (
  id serial PRIMARY KEY,
  user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nama text NOT NULL,
  kontak text,
  catatan text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS suppliers_user_id_idx ON suppliers (user_id);
CREATE TABLE IF NOT EXISTS purchases (
  id serial PRIMARY KEY,
  user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  supplier_id int REFERENCES suppliers(id) ON DELETE SET NULL,
  tanggal date NOT NULL DEFAULT CURRENT_DATE,
  jumlah_karung int NOT NULL CHECK (jumlah_karung > 0),
  biaya int NOT NULL CHECK (biaya >= 0),
  perkiraan_potong int NOT NULL DEFAULT 0,
  catatan text,
  sortir_selesai boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS purchases_user_id_idx ON purchases (user_id);
CREATE TABLE IF NOT EXISTS grade_prices (
  user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  grade char(1) NOT NULL CHECK (grade IN ('A','B','C')),
  harga int NOT NULL CHECK (harga >= 0),
  keterangan text NOT NULL,
  PRIMARY KEY (user_id, grade)
);
CREATE TABLE IF NOT EXISTS items (
  id serial PRIMARY KEY,
  user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purchase_id int REFERENCES purchases(id) ON DELETE SET NULL,
  nama text NOT NULL,
  barcode text NOT NULL,
  grade char(1) NOT NULL CHECK (grade IN ('A','B','C')),
  harga int NOT NULL CHECK (harga >= 0),
  harga_obral int CHECK (harga_obral >= 0),
  jumlah int NOT NULL DEFAULT 1 CHECK (jumlah >= 0),
  jumlah_awal int NOT NULL DEFAULT 1,
  ditinjau boolean NOT NULL DEFAULT false,
  foto_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, barcode)
);
CREATE INDEX IF NOT EXISTS items_user_id_idx ON items (user_id);
CREATE TABLE IF NOT EXISTS sales (
  id serial PRIMARY KEY,
  user_id int NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  item_id int REFERENCES items(id) ON DELETE SET NULL,
  nama text NOT NULL,
  jumlah int NOT NULL CHECK (jumlah > 0),
  harga_satuan int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sales_user_id_idx ON sales (user_id);
DROP VIEW IF EXISTS v_items;
CREATE VIEW v_items AS
SELECT i.*,
  (CURRENT_DATE - i.created_at::date) AS umur,
  COALESCE(i.harga_obral, i.harga) AS harga_jual,
  CASE
    WHEN i.jumlah <= 0 THEN 'habis'
    WHEN i.harga_obral IS NOT NULL THEN 'diobral'
    WHEN i.ditinjau THEN 'ditinjau'
    WHEN (CURRENT_DATE - i.created_at::date) >= 60 THEN 'perlu_obral'
    WHEN (CURRENT_DATE - i.created_at::date) >= 30 THEN 'perlu_diperiksa'
    ELSE 'tersedia'
  END AS status
FROM items i;
