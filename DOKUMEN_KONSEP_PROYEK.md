# nanti. ♡
## Dokumen Konsep dan Spesifikasi Proyek Website Dating Wishlist Bersama

**Nama produk:** nanti  
**Tagline:** Save places, make memories.  
**Konsep utama:** Two people, one wishlist.  
**Jenis aplikasi:** Website responsif yang dapat dipasang ke Home Screen sebagai PWA  
**Perangkat utama:** iPhone (pasangan) dan iPad (pengguna)  
**Model penggunaan:** Privat, hanya dua akun dalam satu koleksi  
**Anggaran layanan:** Target Rp0/bulan dengan layanan free tier  
**Status:** Source code starter telah dibuat; belum dinyatakan sudah online atau berhasil diuji end-to-end dengan layanan asli.

---

## 1. Ringkasan produk

nanti adalah website pribadi untuk pasangan yang sering menemukan rekomendasi tempat dating dari Instagram, Threads, TikTok, Google Maps, atau sumber online lain. Daripada tautan rekomendasi tercecer di chat dan sulit dicari kembali, kedua pengguna menyimpannya ke dalam **satu wishlist bersama**. Semua tempat dapat dicari, dikelompokkan, diberi catatan, difavoritkan, dan ditandai sudah dikunjungi.

Nilai pembeda nanti ialah pengalaman **Share → Save to nanti ♡** dari iPhone dan iPad melalui Apple Shortcuts. Jika aplikasi sosial media memberikan URL saat dibagikan, Shortcuts membawa URL itu ke website nanti. Website menyimpan tautan dengan identitas akun yang login, lalu data tersedia bagi kedua anggota pasangan. Bila sesi login habis, pengguna login lebih dulu; jika aplikasi sumber tidak membagikan URL, tersedia alternatif Copy Link / Paste Link.

Tujuannya bukan menjadi aplikasi pencarian restoran publik atau platform sosial media; tujuan versi pertama ialah mengubah rekomendasi yang ditemukan secara spontan menjadi rencana dating yang benar-benar bisa dilaksanakan.

## 2. Masalah yang diselesaikan

1. Link dari sosial media menumpuk di DM/chat dan sulit ditemukan kembali.
2. Satu orang menyimpan link di perangkatnya, sementara pasangan tidak melihat koleksi tersebut.
3. Rekomendasi lama terlupakan sehingga tidak pernah dikunjungi.
4. Sulit memilih aktivitas saat akhir pekan karena ide tersebar.
5. Tidak ada catatan yang rapi tentang tempat yang sudah dikunjungi bersama.

**Solusi:** satu koleksi privat, selalu dapat diakses dua akun, dengan pencatatan sumber postingan asli dan status kunjungan.

## 3. Pengguna, akun, dan privasi

- **Pengguna A** mengakses nanti dari iPad.
- **Pengguna B** mengakses nanti dari iPhone.
- Masing-masing mempunyai akun login tersendiri menggunakan email dan kata sandi.
- Pengguna pertama membuat wishlist pasangan dan mengundang pengguna kedua melalui tautan atau kode undangan.
- Satu pasangan memiliki **satu wishlist**; bukan dua daftar yang disinkronkan secara manual.
- Setiap item mencatat siapa yang menambahkannya: **Saved by You / Saved by Him** (label adaptif sesuai akun).
- Maksimal dua anggota per pasangan untuk proyek pribadi ini.
- Secara default, pengguna di luar pasangan tidak dapat membaca, mengedit, atau menghapus data pasangan.
- Undangan harus dibatasi dan tidak boleh menjadi izin publik permanen.

### Aturan keamanan

- Gunakan Supabase Auth untuk autentikasi.
- Terapkan kebijakan **Row Level Security (RLS)** pada seluruh tabel yang mengandung data pribadi.
- Hanya anggota pasangan yang berhak membaca/mengubah wishlist mereka.
- Hanya gunakan Supabase **publishable/anon key** di frontend; jangan pernah memasukkan `service_role`/secret key ke React, repositori, atau Apple Shortcut.
- Validasi link dan input; hanya simpan URL yang valid. Cegah penyisipan kode HTML/skrip berbahaya.
- Simpan repositori GitHub sebagai **private**.
- Sediakan ekspor CSV; backup data perlu dilakukan secara berkala.

## 4. Alur utama penggunaan

### A. Onboarding pertama kali

1. Pengguna A membuka nanti, membuat akun dan login.
2. Pengguna A membuat wishlist bersama.
3. Pengguna A menyalin kode/link undangan dari menu **Our Space**.
4. Pengguna B membuka link undangan dari iPhone, membuat akun sendiri dan bergabung.
5. Keduanya melihat koleksi tempat yang sama; tidak perlu berbagi password.

### B. Menyimpan dari Instagram / Threads / TikTok

1. Pengguna menemukan postingan tentang cafe/restoran/aktivitas.
2. Tekan **Share** pada aplikasi asal.
3. Pilih shortcut **Save to nanti ♡** di lembar berbagi iOS/iPadOS.
4. Shortcut menerima URL, menyusun tautan nanti berisi parameter `save`, dan membuka website.
5. Bila pengguna masih login dan tergabung dalam pasangan, website memvalidasi dan menyimpan link secara otomatis.
6. Item masuk ke wishlist pasangan, lengkap dengan platform sumber dan siapa penyimpannya.
7. Pengguna dapat melengkapi nama tempat, kota, kategori, dan catatan kapan saja.
8. Apabila link sudah ada, sistem memberi informasi bahwa item duplikat.

**Batasan nyata:** PWA iOS/iPadOS belum mendukung Web Share Target untuk tampil sebagai aplikasi penerima langsung. Karena itu jalur yang digunakan ialah **Apple Shortcuts**, dan dalam versi awal Shortcut membuka website. Ini bukan integrasi native yang selalu menyimpan secara diam-diam di latar belakang. Pengiriman URL dari Instagram/Threads/TikTok dapat berbeda-beda; fallback wajib tersedia.

### C. Menyimpan secara manual

1. Buka nanti.
2. Tekan tombol **Add Place**.
3. Paste URL yang sudah disalin, atau isi tempat secara manual jika diperlukan.
4. Lengkapi informasi dasar dan simpan.

### D. Menentukan date berikutnya

1. Buka **Want to Go**.
2. Cari berdasarkan nama, kota, atau kategori.
3. Pilih tempat yang diinginkan, atau gunakan tombol **Random Date**.
4. Buka tautan asli untuk melihat konteks rekomendasi.
5. Setelah benar-benar berkunjung, ubah status menjadi **Visited** dan tambahkan catatan pengalaman.

## 5. Fitur inti (MVP / versi pertama)

| Fitur | Fungsi |
|---|---|
| Login dua akun | Pengguna masuk memakai akun masing-masing. |
| Undangan pasangan | Menggabungkan dua akun ke satu wishlist privat. |
| Shared wishlist | Tambah, lihat, edit, dan kelola tempat pada satu koleksi. |
| Share via Shortcuts | Menangkap tautan dari lembar berbagi iPhone/iPad dan membuka website untuk menyimpannya. |
| Tambah link manual | Paste link Instagram, Threads, TikTok, Google Maps, dan URL lain. |
| Deteksi link duplikat | Mencegah penyimpanan rekomendasi sama berkali-kali. |
| Identitas penyimpan | Menampilkan siapa yang menyimpan item. |
| Kategori | Misalnya Cafe, Restaurant, Activity, Outdoor, dan Other. |
| Status kunjungan | Want to Go atau Visited. |
| Favorit | Menandai tempat yang paling ingin dikunjungi. |
| Pencarian dan filter | Menemukan item tanpa perlu membuka chat lama. |
| Random Date | Memilih acak tempat dari wishlist yang sesuai. |
| Catatan tempat | Nama, lokasi/kota, dan catatan bebas. |
| Sinkronisasi | Perubahan terlihat di kedua akun ketika data diperbarui. |
| Export CSV | Mencadangkan daftar tempat ke perangkat. |
| UI responsif | Nyaman di layar iPhone, iPad, dan komputer. |

**Prinsip versi pertama:** menyimpan URL dengan andal lebih penting daripada otomatis menebak nama/foto tempat dari postingan. Pengambilan metadata Instagram/Threads/TikTok tidak boleh dijanjikan karena pembatasan platform, izin konten, dan postingan privat.

## 6. Halaman website

### 6.1 Login / Sign Up
Tampilan sederhana untuk registrasi dan login, serta informasi akses hanya untuk pasangan.

### 6.2 Create / Join Our Space
Pengguna pertama membuat wishlist dan mendapat kode undangan; pengguna kedua bergabung dengan kode yang sama.

### 6.3 Home / Our Places
Halaman utama menampilkan salam, ringkasan Want to Go, Visited, Favorites, form Add Link, daftar rekomendasi terbaru, dan pencarian.

### 6.4 Detail Place
Satu tempat menampilkan nama, kategori, sumber tautan, kota/lokasi (jika ada), catatan, pemilik input, tanggal disimpan, favorit, status, tombol edit, dan tautan untuk membuka postingan asli.

### 6.5 Wishlist / Favorites / Visited
Tampilan tersaring berdasarkan status, kategori, atau favorit. Versi pertama dapat menjadi bagian dari satu halaman Home dengan tab dan filter.

### 6.6 Our Space / Settings
Menampilkan keanggotaan pasangan, kode undangan, backup CSV, logout, dan nanti pengaturan profil.

## 7. Pengalaman desain (UI/UX)

**Arah visual awal:** soft romantic yang minimalis, bersih, hangat, dan tidak berlebihan. Warna utama cream/ivory, dusty pink, dan teks charcoal. Kartu tempat dengan sudut membulat, ruang kosong cukup, tombol besar untuk sentuhan, dan navigasi sederhana. Gaya visual tetap dapat diubah menjadi minimal modern jika diputuskan nanti.

**Prioritas desain:**
- Alur simpan link sangat singkat; idealnya satu aksi Share dan satu aksi Shortcut.
- Informasi tempat tidak terlalu ramai.
- Filter mudah dipakai di iPad dan iPhone.
- Bisa dibuka dari Home Screen seperti aplikasi, tanpa publikasi di App Store.
- Status *Want to Go* dan *Visited* mudah dibedakan.
- Antarmuka jelas ketika link duplikat, koneksi terputus, atau sesi login kedaluwarsa.

## 8. Struktur data inti

Rancangan konseptual data:

- **profiles:** `user_id`, `display_name`, `created_at`.
- **pairs:** `pair_id`, `invite_code`, `created_by`, `created_at`.
- **pair_members:** bila dipakai terpisah, `pair_id`, `user_id`, `joined_at`; proyek starter bisa mengintegrasikan keanggotaan pada profil, menyesuaikan SQL yang sudah dibuat.
- **places:** `place_id`, `pair_id`, `saved_by`, `source_url`, `source_platform`, `name`, `category`, `location_text`, `notes`, `is_favorite`, `status`, `created_at`, `updated_at`.

Normalisasi URL perlu menghapus parameter tracking yang aman dihilangkan untuk mendeteksi duplikasi; URL asli tetap dapat disimpan untuk membuka postingan. Skema final harus mengikuti file `supabase/schema.sql` pada starter, bukan menganggap semua tabel konseptual di atas sudah ada.

## 9. Teknologi dan layanan

| Komponen | Teknologi | Fungsi | Target biaya |
|---|---|---|---|
| Frontend | React + Vite | Membuat antarmuka website | Rp0 |
| UI / styling | CSS responsif | Desain iPhone/iPad | Rp0 |
| Database | Supabase PostgreSQL | Menyimpan wishlist pasangan | Rp0 pada Free tier |
| Authentication | Supabase Auth | Akun dan sesi login | Rp0 pada Free tier |
| Realtime | Supabase Realtime | Pembaruan lintas perangkat | Rp0 dalam kuota Free tier |
| Hosting | Cloudflare Pages | Website HTTPS publik dengan data privat | Rp0 pada Free tier |
| Source control | GitHub private repository | Menyimpan kode dan riwayat perubahan | Rp0 |
| Share di Apple | Apple Shortcuts | Mengirim URL dari menu Share ke website | Rp0 |
| Instalasi di perangkat | PWA / Add to Home Screen | Akses seperti aplikasi | Rp0 |
| Domain | Subdomain bawaan Cloudflare `pages.dev` | Alamat website | Rp0 jika nama tersedia |

**Batasan biaya:** target Rp0/bulan berlaku selama pemakaian dan kuota sesuai ketentuan gratis. Pada November 2026, Supabase Free menawarkan database 500 MB dan file storage 1 GB; proyek dengan aktivitas rendah dapat dijeda. Tidak ada keharusan membeli domain, akun developer Apple, atau langganan AI untuk MVP.

## 10. Fitur lanjutan setelah MVP stabil

1. **Date Map:** menampilkan rekomendasi pada peta jika pengguna mengisi lokasi atau koordinat; integrasi peta dipilih dengan memperhitungkan batas API dan biaya.
2. **Date Memories:** foto, tanggal kunjungan, rating pribadi, dan cerita pendek; gunakan storage dengan kontrol akses serta kapasitas.
3. **Date Planner:** itinerary beberapa tempat untuk satu hari, pengingat dan perkiraan biaya.
4. **Mood Filter:** Romantic, Budget Friendly, Outdoor, Anniversary, Hidden Gems.
5. **Pick Our Next Date:** pemilihan acak dengan filter budget, area, dan mood.
6. **Koleksi tematik:** Weekend Ideas, Anniversary Ideas, Cafe Hopping, dan lainnya.
7. **Preview otomatis:** hanya dari sumber yang memberi izin dan metadata yang benar-benar dapat diakses; gagal otomatis harus tetap dapat disimpan manual.
8. **Impor hasil backup:** mengembalikan CSV yang sebelumnya diekspor, dengan validasi dan pencegahan duplikasi.
9. **Notifikasi aktivitas pasangan:** opsional dan harus mempertimbangkan dukungan platform serta kenyamanan pengguna.

Fitur lanjutan **belum boleh dianggap sudah tersedia** hanya karena tercantum pada roadmap.

## 11. Tahapan pengerjaan

**Tahap 1 — Fondasi:** desain UI responsif, proyek React/Vite, repository GitHub privat, skema data, autentikasi, RLS, undangan pasangan.

**Tahap 2 — Wishlist:** tambah/edit tempat, kategori, pencarian, status, favorit, identitas penyimpan, deteksi duplikasi, sinkronisasi dan ekspor CSV.

**Tahap 3 — Integrasi Apple:** setup Shortcuts untuk kedua perangkat, meneruskan URL ke nanti, menangani session login, serta fallback Copy/Paste.

**Tahap 4 — Deploy gratis:** buat Supabase Free, konfigurasi environment variables, deploy ke Cloudflare Pages, set URL Auth, uji HTTPS dan PWA.

**Tahap 5 — Pengujian nyata:** dua akun, dua perangkat, tambah item dari Instagram/Threads/TikTok, validasi duplikat, tes edit/status, uji akun ketiga tidak bisa membaca data, serta tes pemulihan dari backup.

**Tahap 6 — Pengembangan lanjutan:** peta, foto memori, itinerary, dan metadata bila dibutuhkan.

## 12. Kriteria aplikasi dianggap selesai untuk MVP

- [ ] Website online di alamat HTTPS gratis.
- [ ] Pengguna A dapat membuat akun, login, dan membuat satu wishlist pasangan.
- [ ] Pengguna B dapat membuat akun terpisah lalu bergabung melalui undangan.
- [ ] Keduanya membaca dan memperbarui wishlist yang sama.
- [ ] Akun ketiga tidak dapat membaca atau mengubah wishlist berdasarkan RLS.
- [ ] Link Instagram/Threads/TikTok yang valid dapat disimpan, minimal melalui salin-tempel.
- [ ] Shortcut di iPhone dan iPad dapat menerima URL dan membuka nanti untuk menyimpannya dengan akun login.
- [ ] Link duplikat ditandai dan tidak membuat item ganda.
- [ ] Nama, kategori, lokasi dan catatan tempat dapat diedit.
- [ ] Status Want to Go / Visited dan Favorite bekerja.
- [ ] Search/filter dan Random Date bekerja.
- [ ] Export CSV menghasilkan daftar yang dapat dibuka.
- [ ] Tampilan nyaman di iPhone dan iPad.
- [ ] Tombol/logika error bekerja saat internet terputus atau sesi berakhir.

## 13. Kondisi proyek saat dokumen ini dibuat

Paket ZIP starter nanti telah dibuat pada 3 November 2026 dan berisi antara lain `src/App.jsx`, `src/styles.css`, `src/lib.js`, `supabase/schema.sql`, `README.md`, dan halaman preview. Isi starter menyatakan fitur-fitur MVP telah ditulis dalam source code. Namun, **status operasional belum dapat diklaim** sampai database Supabase dibuat, environment variables dipasang, website dideploy, dan pengujian dua perangkat diselesaikan.

Hal yang belum termasuk pada starter: scraping konten sosial media, Google Maps terpadu, upload foto kenangan, import CSV, notifikasi push, aplikasi native App Store, dan UI reset password.

## 14. Pernyataan visi produk

> **nanti adalah rumah digital kecil untuk dua orang dan semua tempat yang ingin mereka kunjungi bersama.** Satu link rekomendasi yang ditemukan di Instagram, Threads, atau TikTok dapat berubah menjadi satu ide date, kemudian satu tempat yang benar-benar dikunjungi, dan akhirnya satu kenangan. Fokus produk ialah menyimpan rekomendasi dengan cepat, menjaga privasi, membantu memilih tempat, dan menjadikan pengalaman berdua lebih mudah direncanakan.

---

## Rujukan teknis (dicek 3 November 2026)

- Apple Support, Shortcuts input types and Share Sheet: https://support.apple.com/en-gb/guide/shortcuts/apd7644168e1/ios
- Browser Share Target compatibility: https://web-platform-dx.github.io/web-features-explorer/features/app-share-targets/
- Supabase Free pricing/quotas: https://supabase.com/pricing
- Supabase free-project pausing: https://supabase.com/kb/faqs/platform/free-project-pausing
- Cloudflare Pages free-plan limits: https://developers.cloudflare.com/pages/platform/limits/
