# Date Memories — tambahan untuk NANTI ♡

**Branch:** `feature/date-memories-mood-drive-links`

Versi ini menambahkan **Our Memories**, tanpa menghapus atau mengubah tabel `places` dan tanpa mengubah alur login/wishlist pasangan.

## Apa yang sudah diimplementasikan
- Menu **Our Memories** di navigasi desktop, menu mobile, serta tombol di homepage.
- Tambah, edit, dan hapus kenangan bersama melalui Supabase.
- Judul, tanggal kunjungan, **mood emoji** (tanpa rating bintang), cerita (4.000 karakter), serta tautan ke tempat di wishlist (opsional).
- Maksimal lima **tautan file foto Google Drive** per kenangan. Aplikasi menyimpan **link saja**, bukan file foto.
- Filter mood, urutan tanggal, dan tampilan responsif iPhone/iPad.
- RLS: hanya dua anggota pasangan yang punya akses ke entri kenangan.
- Mode demo lokal jika aplikasi belum terhubung ke Supabase.

## Sebelum merge PR / publish ke produksi

1. **Backup data Supabase** penting terlebih dulu.
2. Di Supabase Dashboard → **SQL Editor**, jalankan isi file [`supabase/migrations/20261104_date_memories.sql`](./supabase/migrations/20261104_date_memories.sql). SQL ini menambah tabel `memories` dengan aturan akses pair. **Jangan jalankan ulang keseluruhan `supabase/schema.sql`** untuk membuat fitur ini.
3. Pada Supabase → Database → Replication (jika ingin perubahan langsung muncul di dua perangkat), tambahkan tabel `public.memories` ke publication `supabase_realtime`. Tanpa itu, halaman tetap me-refresh data saat dibuka kembali/focus.
4. Tes login dengan dua akun pasangan. Buat memory, ubah mood, edit cerita, tempel URL Drive, kemudian cek dari akun pasangan.
5. Tes akun lain tidak bisa mengakses entri atau memodifikasi data via Supabase RLS.
6. Setelah SQL dan pengujian lolos, baru merge PR ke `main` agar Cloudflare deploy otomatis.

## Cara menyimpan foto di Google Drive (versi sekarang)

1. Di Google Drive, buat folder **NANTI — Our Memories** pada akun Google yang dipilih.
2. Upload foto dengan aplikasi Drive di iPhone/iPad.
3. Bagikan akses file **secara terbatas ke akun Google kalian berdua** (lebih privat), lalu pilih **Copy link**.
4. Di NANTI → Our Memories → Add a memory → tempel link foto, **satu link per baris**.
5. Tautan foto akan tersedia untuk dibuka melalui Google Drive; akses tetap tergantung izin pada Drive.

**Batasan penting:** ini *belum* otomatis mengunggah foto dari NANTI ke Drive, juga belum menampilkan thumbnail foto langsung di kartu. Kedua hal tersebut membutuhkan tahap integrasi Google OAuth dan backend aman, misalnya Cloudflare Worker. Jangan pernah menaruh Google OAuth client secret, refresh token, atau Google service-account private key di kode React/Vite, GitHub, maupun variabel `VITE_...`.

**Google Drive bukan bagian dari RLS Supabase**: walaupun data kenangan privat, orang lain bisa membuka foto bila file Drive disetel ke "Anyone with the link". Pilih `Restricted` dan beri akses hanya ke dua akun Google kalian.

## Struktur baru
- `src/Memories.jsx` — UI halaman, form dan kartu.
- `src/memories.css` — gaya responsif tambahan.
- `src/App.jsx` — navigasi, query dan operasi database.
- `supabase/migrations/20261104_date_memories.sql` — migrasi schema.

Tidak ada kredensial atau OAuth token baru yang dibutuhkan untuk versi **Drive links** ini.
