# nanti. ♡ — Places we'll go, memories we'll make

Versi awal website pribadi untuk **2 akun, 1 wishlist**. Dibuat dengan **React + Vite, Supabase Free, Cloudflare Pages Free, dan Apple Shortcuts**. Tanpa biaya langganan wajib jika masih dalam batas Free tier.

## Apa yang sudah ada?

- Dua akun pribadi menggunakan email + password.
- Satu wishlist bersama. Akun pertama membuat pasangan dan mengundang akun kedua via kode/link undangan; maksimal dua anggota.
- Tambah link Instagram, Threads, TikTok, Google Maps, atau tautan HTTP(S) lain.
- Save via Apple Shortcuts yang membuka `https://alamat-website-kalian/?save=URL`; **setelah pengguna login dan punya wishlist, link disimpan otomatis**.
- Sinkronisasi data melalui Supabase Realtime, plus refresh saat tab difokuskan. Backup lokal CSV tersedia dari menu Our space.
- Kategori, cari tempat, edit nama/lokasi/catatan, status Want to Go/Visited, favorit, deteksi duplikat, serta tombol random date.
- Privasi menggunakan Row Level Security (RLS): akun di luar pasangan tidak boleh membaca daftar kalian.
- Mode preview lokal bila belum memasukkan kredensial Supabase. **Preview ini tidak menyimpan/sinkronkan data sungguhan.**

> Catatan: mengambil foto, alamat, nama restoran dari konten Instagram/Threads/TikTok **tidak dijanjikan**. MVP menyimpan tautan asli dan menampilkan nama awal berdasarkan sumber; detail tempat diisi sendiri. Link privat dan konten yang dibatasi platform tidak bisa dibaca otomatis.

## 1) Yang perlu disiapkan

1. Akun gratis di https://github.com/ (untuk repository privat).
2. Akun gratis di https://supabase.com/ (database + login).
3. Akun gratis di https://pages.cloudflare.com/ (hosting).
4. Node.js LTS di komputer (unduh dari https://nodejs.org/). Dipakai untuk menjalankan dan membangun kode, bukan untuk pengguna website.
5. iPhone dan iPad yang memiliki aplikasi Apple **Shortcuts / Pintasan**.

Jangan masukkan nomor kartu pembayaran atau pilih paket berbayar apabila ingin tetap Rp0. Batas Free dapat berubah sewaktu-waktu.

## 2) Jalankan di komputer

Ekstrak ZIP, lalu buka terminal di folder `nanti`:

```bash
npm install
npm run dev
```

Buka alamat lokal yang muncul (umumnya http://localhost:5173). Tanpa `.env` aplikasi menampilkan **mode preview** agar kamu bisa menilai desain dan mencoba filter/tombol. Data preview hilang saat refresh.

## 3) Buat database di Supabase

1. Masuk https://supabase.com/dashboard, klik **New project** dan pilih **Free**.
2. Buat project; pada dashboard masuk ke **SQL Editor**.
3. Buka file `supabase/schema.sql`, salin seluruh isinya, jalankan di **SQL Editor**. SQL ini membuat tabel `pairs`, `profiles`, `places`, fungsi buat/gabung pasangan, kebijakan RLS, dan Realtime.
4. Di **Authentication → Providers → Email**, gunakan autentikasi email/password. Untuk keamanan, biarkan konfirmasi email aktif. Pengiriman email verifikasi mengikuti batas/rate limit Supabase; jika email konfirmasi tidak datang, cek folder spam dan dashboard Auth.
5. Di **Project Settings → API** (atau layar **Connect**, bergantung pada tampilan dashboard), salin **Project URL** dan **publishable key / anon key**.

Buat file `.env` di folder root (di samping `package.json`):

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_... 
```

**Penting:** hanya gunakan publishable/anon key. JANGAN PERNAH gunakan `service_role` / `secret` key di frontend atau repository. File `.env` sudah masuk `.gitignore`.

Setelah itu restart `npm run dev`. Kamu akan melihat form login yang sesungguhnya.

## 4) Buat akun dan hubungkan pasangan

1. Buka website, klik **Sign up**. Buat akun untukmu, lalu konfirmasi email jika diminta.
2. Login, pilih **Buat wishlist**.
3. Klik **Our space / Invite partner**, salin link undangan atau kodenya.
4. Kirim ke cowokmu. Dia membuka link lewat iPhone, membuat akun email miliknya, lalu memilih **Gabung pasangan** (kode terisi otomatis bila link undangan tetap terbuka).
5. Kalian sudah melihat wishlist bersama dari dua akun.

**Keamanan:** undangan diproses dengan fungsi SQL yang membatasi maksimal dua anggota. Jangan kirim link undangan ke orang lain. Untuk proyek pribadi, aktifkan verifikasi email di Supabase dan gunakan kata sandi kuat.

## 5) Deploy website GRATIS via GitHub + Cloudflare Pages

1. Buat repository GitHub **Private** dan upload semua file proyek, **kecuali** `.env`, `node_modules`, dan `dist`.
2. Buka **Cloudflare Dashboard → Workers & Pages → Create → Pages → Connect to Git** (tampilan menu bisa sedikit berubah).
3. Pilih repository GitHub berisi nanti.
4. Atur **Framework preset: Vite**; **Build command: `npm run build`**; **Build output directory: `dist`**. Root directory adalah root repository.
5. Di **Environment variables**, isi:
   - `VITE_SUPABASE_URL` = alamat Supabase project.
   - `VITE_SUPABASE_ANON_KEY` = publishable/anon key Supabase.
6. Klik **Save and Deploy**. Setelah berhasil, Cloudflare memberikan domain gratis seperti `https://nama-project.pages.dev` (nama harus tersedia).
7. Kembali ke Supabase **Authentication → URL Configuration**. Set **Site URL** ke domain Pages sebenarnya; tambahkan domain tersebut ke **Redirect URLs** bila perlu konfirmasi email/password reset.
8. Di iPhone dan iPad, buka alamat website yang sama. Kamu dan pasangan login menggunakan akun masing-masing.

**Jangan** menambahkan `service_role` secret ke Cloudflare sebagai `VITE_...` — semua variabel yang diawali `VITE_` akan ikut di-bundle ke browser.

Cloudflare Pages Free punya batas build bulanan. Supabase Free memberi database 500 MB (cukup untuk banyak link teks, bukan jaminan tanpa batas) dan dapat **pause** bila aktivitas rendah sekitar seminggu. Pantau penggunaan pada dashboard dan backup data penting.

## 6) Buat Shortcut Apple: "Save to nanti ♡"

**Tujuan:** di Instagram/Threads/TikTok → Share → pilih shortcut → membuka website nanti dan menyimpan link secara otomatis bila sudah login serta tergabung dalam wishlist. **Shortcut ini tidak bisa menjamin website langsung berjalan di background tanpa terbuka.**

Di iPhone/iPad, buka aplikasi **Shortcuts / Pintasan**:

1. Tekan **+** untuk membuat shortcut baru, beri nama `Save to nanti ♡`.
2. Buka **Details / Detail Shortcut**, aktifkan **Show in Share Sheet / Tampilkan di Lembar Berbagi**.
3. Atur agar menerima **URLs / URL** (opsional juga **Safari web pages**). Nama tombol sedikit berbeda mengikuti bahasa iOS.
4. Tambahkan aksi untuk **mengambil URL dari Shortcut Input**. Di beberapa versi tertulis **Get URLs from Input**; jika input sudah URL, gunakan langsung variabel `Shortcut Input`.
5. Tambahkan aksi **URL Encode** untuk meng-encode URL postingan (encode sebagai komponen query, bukan seluruh URL nanti). Nama aksi bisa ditampilkan sebagai **URL Encode / Encode URL**.
6. Tambahkan aksi **Text** berisi:

   ```text
   https://NAMA-PROJECT.pages.dev/?save=HASIL-URL-ENCODE
   ```

   Ganti `NAMA-PROJECT` dengan domain Pages milikmu. Pada bagian `HASIL-URL-ENCODE`, **masukkan variabel hasil aksi URL Encode dari Shortcuts**, bukan mengetik teks itu secara literal.
7. Tambahkan aksi **Open URLs** menggunakan teks URL hasil langkah 6.
8. Simpan dan uji dari Safari dengan sebuah URL postingan yang kamu punya. Jika berhasil, website akan membuka dan memunculkan pesan **Saved from your Share Sheet ♡**. Coba sekali dari Instagram/Threads juga.
9. Jika aplikasi sosial media tertentu tidak mengirim input URL lewat Share Sheet, pilih **Copy link** terlebih dahulu dan gunakan URL dari clipboard atau tambahkan manual di nanti. Perilaku ini tergantung aplikasi dan versi iOS/iPadOS.

Shortcut perlu dipasang di **kedua perangkat**. Keduanya memakai URL nanti yang **sama**. Kamu dan pasangan tetap login di browser masing-masing.

### Pengujian Share Sheet yang penting

- Uji URL Instagram publik; cek tampilan hasil tersimpan di kedua akun.
- Share URL sama dua kali; yang kedua seharusnya menampilkan "Link ini sudah ada".
- Uji dari iPhone dan iPad, karena perilaku Share Sheet dan browser PWA bisa berbeda.
- Uji setelah logout; saat login ulang, parameter `?save=` tetap akan diproses ketika masuk.
- Sesudah berhasil simpan, URL `?save=` dibersihkan dari address bar untuk menghindari penyimpanan ulang setelah refresh.

## 7) Kenapa shortcut memakai website, bukan langsung POST ke Supabase?

Pendekatan ini sengaja **tidak menaruh token rahasia database di Apple Shortcut**. Shortcut hanya membuka halaman nanti yang sudah memakai sesi login Supabase; hanya akun sah yang boleh menulis data lewat RLS. Lebih mudah di-maintain, dan pengguna tetap bisa membetulkan nama/kategori setelah link tersimpan. Karena browser dibuka, ini **bukan integrasi native** yang beroperasi diam-diam tanpa UI.

## 8) Apa yang belum ada di MVP ini?

- Tidak ada scraping konten Instagram/Threads/TikTok atau pengambilan cover foto otomatis.
- Tidak ada Google Maps terintegrasi atau geolokasi otomatis.
- Tidak ada upload foto kenangan (menghindari biaya storage; bisa ditambahkan nanti).
- Backup CSV tersedia dari **Our space → Download wishlist backup**; simpan file backup secara pribadi. Restore/import CSV belum tersedia.
- Tidak ada Push Notification, App Store, atau aplikasi iOS native.
- Tidak ada reset password lewat UI (bisa ditambahkan setelah deploy).

## 9) Test keamanan sederhana

1. Login sebagai orang pertama dan kedua, pastikan daftar sinkron.
2. Buat akun ketiga terpisah. Tanpa kode undangan, akun ketiga **tidak dapat membaca** tempat kalian (RLS).
3. Gunakan kode undangan saat anggota sudah dua: backend harus menolak dengan pesan "Wishlist ini sudah memiliki 2 anggota".
4. Jangan pernah commit `.env` atau share screenshot dashboard yang berisi secret key.

Semoga tempat-tempat yang kalian simpan satu per satu jadi cerita manis yang benar-benar dikunjungi ♡
