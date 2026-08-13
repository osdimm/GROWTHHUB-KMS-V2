# DOKUMEN STRATEGI DAN MATRIKS PENGUJIAN (BLACK BOX TESTING)
**Aplikasi**: Growth Hub KMS (Knowledge Management System)  
**Teknologi**: Vite + React + TypeScript + Supabase + Tailwind CSS + Vitest  
**Versi**: 1.0.0  
**Tanggal Update**: 01 Agustus 2026  

---

## 1. PENDAHULUAN & STRATEGI PENGUJIAN

Pengujian aplikasi **Growth Hub KMS** dilakukan dengan pendekatan berlapis:
1. **Black Box Testing**: Pengujian end-to-end berbasis skenario dari sudut pandang pengguna akhir (User Interface & User Experience) tanpa bergantung pada struktur internal kode.
2. **White Box Testing**: Automated Unit Test & Integration Test berbasis Vitest dan React Testing Library untuk memverifikasi logika bisnis, privasi data antar-divisi, serta komponen UI.

---

## 2. MATRIKS SKENARIO BLACK BOX TESTING (`TESTING.md`)

Setiap fitur di bawah ini dilengkapi dengan minimal **1 Kasus Positif** (input valid / berwenang) dan **1 Kasus Negatif** (input tidak valid / tidak berwenang).

| ID Test Case | Fitur | Skenario | Langkah Pengujian | Input Data | Expected Result (Hasil yang Diharapkan) | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-BB-AUT-001** | Autentikasi | Login Positif dengan Kredensial Valid | 1. Buka Halaman Login<br>2. Masukkan Email & Password terdaftar<br>3. Klik tombol "Masuk Sistem" | Email: `dandi.p@gmail.com`<br>Password: `password123` | Sistem berhasil melakukan autentikasi, mengarahkan user ke Dashboard utama, dan menyimpan sesi login. | | |
| **TC-BB-AUT-002** | Autentikasi | Login Negatif dengan Password Salah | 1. Buka Halaman Login<br>2. Masukkan Email valid & Password salah<br>3. Klik "Masuk Sistem" | Email: `dandi.p@gmail.com`<br>Password: `wrongpass` | Sistem menolak login dan menampilkan pesan error: *"Email atau kata sandi tidak sesuai"*. | | |
| **TC-BB-AUT-003** | Autentikasi | Isolasi Sesi Multi-Tab (2 Akun Berbeda) | 1. Buka Tab 1: Login Akun Admin (Dandi)<br>2. Buka Tab 2: Switch / Login Akun Karyawan (Ananda)<br>3. Periksa profil pada Tab 1 & Tab 2 | Tab 1: Admin Dandi<br>Tab 2: Karyawan Ananda | Sesi Tab 1 tetap sebagai Admin dan Tab 2 sebagai Karyawan tanpa terjadi pencampuran data sesi antar-tab (*tab session isolation*). | | |
| **TC-BB-AUT-004** | Autentikasi | Logout Membersihkan Sesi | 1. Login ke aplikasi<br>2. Klik tombol "Keluar / Logout" pada sidebar | Klik Logout | Sesi `sessionStorage` & `localStorage` dibersihkan, halaman langsung kembali ke layar Login, dan user tidak bisa menekan `Back` browser untuk masuk tanpa re-login. | | |
| **TC-BB-AUT-005** | Autentikasi | Force Password Change untuk User Baru (Positif) | 1. Login akun baru dengan flag reset<br>2. Isi Password Baru $\ge 6$ karakter<br>3. Klik Simpan Password | Password Baru: `passwordBaru123` | Modal reset password berhasil diproses, data password terbarui, dan user masuk ke aplikasi. | | |
| **TC-BB-AUT-006** | Autentikasi | Force Password Change (Negatif - Password Terlalu Pendek) | 1. Login akun baru<br>2. Isi Password Baru $< 6$ karakter<br>3. Klik Simpan | Password Baru: `123` | Sistem menampilkan pesan error validasi *"Kata sandi minimal 6 karakter"* dan memblokir penutupan modal. | | |
| **TC-BB-FOR-001** | Forum Diskusi | Buat Topik Baru (Positif - Role Karyawan/Manajer/Admin) | 1. Masuk Forum Diskusi<br>2. Klik "Buat Topik Baru"<br>3. Pilih Kategori Divisi, isi Judul & Konten<br>4. Klik Submit | Kategori: `Graphic Design`<br>Judul: `Diskusi SOP Design`<br>Isi: `Pertanyaan SOP...` | Topik baru berhasil dibuat dan langsung muncul di daftar forum diskusi divisi terkait. | | |
| **TC-BB-FOR-002** | Forum Diskusi | Pembatasan Akses Aksesibilitas Forum (Negatif - Role Associate) | 1. Switch Role ke `Associate`<br>2. Buka Halaman Forum Diskusi | Role: `Associate` | Sistem membatasi fitur penulisan atau menampilkan banner read-only / restriksi posting untuk role Associate. | | |
| **TC-BB-FOR-003** | Forum Diskusi | Kirim Komentar Top-Level (Positif) | 1. Buka salah satu topik forum<br>2. Ketik komentar di kolom bawah<br>3. Klik Kirim / Tekan `Enter` | Komentar: `Terima kasih SOP sangat jelas.` | Komentar muncul di bagian bawah daftar komentar top-level. | | |
| **TC-BB-FOR-004** | Forum Diskusi | Kirim Komentar Kosong (Negatif) | 1. Buka topik forum<br>2. Biarkan kolom komentar kosong<br>3. Tekan `Enter` | Komentar: ` ` (spasi saja) | Tombol kirim tidak aktif atau sistem memblokir pengiriman komentar kosong. | | |
| **TC-BB-FOR-005** | Forum Diskusi | Balas Komentar Nested (Reply Level 1 & 2+) | 1. Klik tombol "Balas" pada komentar orang lain<br>2. Ketik balasan<br>3. Kirim balasan | Balasan: `@Ananda Reva Saya setuju` | Komentar balasan terindikasi indented (masuk ke dalam) di bawah komentar utama dengan tag mention yang jelas. | | |
| **TC-BB-FOR-006** | Forum Diskusi | Autocomplete & Highlight `@mention` | 1. Ketik `@` di kolom balasanUbah aturan visibilitas dokumen Handover Rotasi: yang menentukan siapa boleh melihat sebuah dokumen adalah ROLE dari uploader-nya, BUKAN divisi. Jika dokumen di-upload oleh seorang Manajer, HANYA user dengan role Manajer (dari divisi manapun) yang boleh melihat dokumen tersebut. Anggota biasa (Karyawan/Associate) di divisi yang sama dengan uploader TIDAK BOLEH melihat dokumen ini, meskipun mereka satu divisi.

Kolom baru "author_role" TEXT sudah ditambahkan ke tabel handover_docs di Supabase untuk menyimpan role uploader saat dokumen diunggah.

Lakukan perubahan berikut:

## 1. Simpan role uploader saat upload

Di handler handleAddHandover (App.tsx), pastikan objek HandoverDoc yang dibuat menyertakan field authorRole, diisi dari currentUser.role saat itu (role uploader pada saat upload, bukan role yang bisa berubah nanti).

Update juga type HandoverDoc di types.ts untuk menambahkan field: authorRole: string.

Update saveHandoverDocToSupabase dan getHandoverDocsFromSupabase di services/supabaseService.ts untuk mapping field authorRole <-> author_role, mengikuti pola mapping camelCase <-> snake_case yang sudah dipakai untuk field lain di file yang sama.

## 2. Filter dokumen yang ditampilkan berdasarkan role, bukan divisi

Di komponen yang menampilkan list Handover Rotasi (HandoverRotasiView), filter dokumen yang ditampilkan ke currentUser SESUAI aturan: currentUser HANYA bisa melihat dokumen yang authorRole-nya SAMA PERSIS dengan currentUser.role (contoh: user dengan role "Manajer" hanya melihat dokumen dengan authorRole "Manajer", TIDAK PEDULI divisi dokumen tersebut berasal dari divisi mana).

PENGECUALIAN: role "Admin" tetap bisa melihat SEMUA dokumen handover dari role manapun (karena admin butuh visibilitas penuh untuk keperluan pengawasan sistem) — KECUALI jika saya bilang sebaliknya nanti.

Terapkan filter ini di level rendering data (sebelum data ditampilkan ke UI), bukan hanya menyembunyikan lewat CSS.

## 3. Update filter divisi yang sudah ada (jika ada)

Cek apakah HandoverRotasiView sebelumnya juga punya filter berdasarkan divisi (dropdown "Semua Divisi" dsb seperti di Forum Diskusi) — jika ada, filter divisi ini TETAP BOLEH ada sebagai filter TAMBAHAN untuk pencarian/browsing (misal Manajer ingin cari handover dari divisi tertentu), tapi filter ROLE (langkah 2) tetap jadi aturan UTAMA yang membatasi visibilitas dasar terlebih dahulu.

## 4. Pesan untuk user yang tidak berwenang

Jika Karyawan/Associate membuka halaman Handover Rotasi dan tidak ada dokumen yang authorRole-nya cocok dengan role mereka (karena semua handover di-upload oleh Manajer), tampilkan pesan yang jelas seperti "Belum ada dokumen handover yang tersedia untuk role Anda" — BUKAN pesan error atau halaman kosong tanpa penjelasan.

## KONFIRMASI

Setelah diterapkan, tunjukkan kode akhir bagian filter di HandoverRotasiView, dan konfirmasi skenario berikut sudah benar:
- Manajer Divisi A upload handover → Manajer Divisi B BISA melihat, Karyawan Divisi A TIDAK BISA melihat.
- Karyawan (jika bisa upload handover) upload handover → hanya sesama Karyawan yang bisa melihat, Manajer TIDAK BISA melihat (kecuali requirement ini perlu saya konfirmasi ulang — beri tahu saya jika ada ambiguitas soal role Karyawan mengupload handover).<br>2. Pilih nama dari dropdown autocomplete<br>3. Kirim balasan | Text: `@Andi Darmawan mohon dicek` | Teks `@Andi Darmawan` otomatis diberi highlight warna khusus (badge neon/blue) pada hasil terbitan. | | |
| **TC-BB-FOR-007** | Forum Diskusi | Kirim Pesan: `Enter` vs `Shift+Enter` | 1. Ketik baris 1, tekan `Shift+Enter`<br>2. Ketik baris 2, tekan `Enter` | Baris 1<br>Baris 2 | `Shift+Enter` menambah baris baru tanpa mengirim, sedangkan `Enter` mengirimkan seluruh pesan yang sudah berbaris ganda. | | |
| **TC-BB-FOR-008** | Forum Diskusi | Like & Unlike Komentar | 1. Klik ikon Jempol/Like pada komentar<br>2. Klik sekali lagi untuk Unlike | Klik Like | Jumlah like bertambah +1 saat di-like, dan berkurang -1 saat di-unlike. | | |
| **TC-BB-FOR-009** | Forum Diskusi | Pin / Unpin Komentar (Positif - Role Manajer/Admin) | 1. Login sebagai Manajer/Admin<br>2. Klik tombol "Pin Komentar" | Klik Pin | Komentar berpindah ke urutan paling atas dengan indikator badge `📌 Sematan Utama`. | | |
| **TC-BB-FOR-010** | Forum Diskusi | Pin Komentar (Negatif - Karyawan Biasa) | 1. Login sebagai Karyawan biasa<br>2. Periksa ketersediaan opsi Pin Komentar | Role: `Karyawan` | Tombol Pin Komentar tidak muncul atau tidak dapat diakses oleh Karyawan biasa. | | |
| **TC-BB-FOR-011** | Forum Diskusi | Hapus Komentar Sendiri vs Komentar Orang Lain | 1. Login sebagai User A<br>2. Hapus komentar milik User A<br>3. Cek komentar milik User B | User A | User A bisa menghapus komentarnya sendiri, namun tombol hapus TIDAK ada pada komentar milik User B. | | |
| **TC-BB-FOR-012** | Forum Diskusi | Hapus Topik Forum (Khusus Admin) | 1. Login sebagai Admin<br>2. Klik ikon Hapus Topik di pojok topik<br>3. Konfirmasi Hapus | Admin Dandi | Topik beserta seluruh balasan didalamnya terhapus permanen dari sistem. | | |
| **TC-BB-FOR-013** | Forum Diskusi | Realtime Sync Cross-Device (Multi Window) | 1. Buka Window 1 & Window 2 di topik sama<br>2. Kirim balasan dari Window 1 | Pesan: `Realtime Test` | Komentar baru di Window 1 otomatis muncul di Window 2 tanpa perlu melakukan reload halaman. | | |
| **TC-BB-VER-001** | Verifikasi & Notifikasi | Upload Dokumen Karyawan Divisi A $\rightarrow$ Notifikasi Manajer Divisi A | 1. Karyawan A (Graphic Design) upload dokumen baru<br>2. Periksa lonceng notifikasi Manajer Divisi A & Divisi B | Uploader: `Karyawan A` (Graphic Design) | HANYA Manajer Divisi Graphic Design yang menerima notifikasi *"Pengajuan Verifikasi Konten Baru"*. Manajer/User divisi B tidak menerima. | | |
| **TC-BB-VER-002** | Verifikasi & Notifikasi | Approval Dokumen oleh Manajer | 1. Manajer Graphic Design klik **Approve** dengan catatan<br>2. Cek notifikasi Uploader & Anggota Divisi lain | Approve Note: `Sudah baik` | Uploader menerima notifikasi *"✅ Pengajuan Disetujui"*, sedangkan seluruh anggota divisi (selain uploader) mendapat notifikasi *"📚 Dokumen Baru"*. | | |
| **TC-BB-VER-003** | Verifikasi & Notifikasi | Rejection Dokumen oleh Manajer | 1. Manajer Graphic Design klik **Reject** dengan alasan<br>2. Cek notifikasi di seluruh akun | Reject Note: `Format kurang sesuai` | HANYA Uploader yang menerima notifikasi *"❌ Pengajuan Ditolak"*. Anggota lain & Admin luar divisi TIDAK menerima notifikasi apapun. | | |
| **TC-BB-VER-004** | Verifikasi & Notifikasi | Notifikasi Luar Divisi (Negatif Test - Strict Boundary) | 1. Uploader Divisi Graphic Design ajukan dokumen<br>2. Cek akun User & Admin di Divisi Talent Development | User Divisi B & Admin | Pengguna di luar divisi terkait mendapatkan 0 notifikasi (tidak terjadi kebocoran data antar-divisi). | | |
| **TC-BB-VER-005** | Verifikasi & Notifikasi | Waktu Relatif Notifikasi Dinamis (`getRelativeTime`) | 1. Amati notifikasi baru (0-59 detik)<br>2. Biarkan panel notifikasi terbuka selama 30 detik | Timestamp | Notifikasi pertama kali menampilkan *"Baru saja"*, lalu berubah menjadi *"1 menit yang lalu"* secara otomatis. | | |
| **TC-BB-USR-001** | Manajemen User | Tambah / Edit User Baru (Positif - Role Admin) | 1. Login Admin<br>2. Buka Kelola Pengguna<br>3. Tambah User Baru | Name: `Rian Pro`, Email: `rian@gmail.com`, Role: `Karyawan` | User baru berhasil ditambahkan dan dapat digunakan untuk login. | | |
| **TC-BB-USR-002** | Manajemen User | Tambah User Baru (Negatif - Email Duplikat) | 1. Login Admin<br>2. Input Email yang sudah terdaftar sebelumnya | Email: `dandi.p@gmail.com` | Sistem menolak pendaftaran dan menampilkan pesan error *"Email sudah terdaftar"*. | | |
| **TC-BB-USR-003** | Manajemen User | Ubah Role User & Verifikasi Hak Akses Baru | 1. Admin ubah Role User X dari Karyawan menjadi Manajer<br>2. Login sebagai User X | Role Baru: `Manajer` | User X kini memiliki menu Verifikasi Dokumen dan fitur approval manajer. | | |
| **TC-BB-FRM-001** | Form & Validasi | Submit Handover / KB tanpa Memilih Dropdown (Negatif) | 1. Buka Modal Unggah Handover / KB<br>2. Isi Judul & Berkas<br>3. Biarkan Dropdown Periode / Divisi Kosong<br>4. Klik Simpan | Dropdown: `""` (Kosong) | Form memblokir pengiriman dan menampilkan pesan error *"Harap pilih Divisi/Periode Rotasi terlebih dahulu"*. | | |
| **TC-BB-FRM-002** | Form & Validasi | Submit Handover / KB dengan Dropdown Terisi (Positif) | 1. Buka Modal Unggah<br>2. Pilih Opsi Dropdown Kustom<br>3. Klik Simpan | Dropdown: `Graphic Design` | CustomSelect menampilkan opsi valid dan form berhasil disubmit. | | |
| **TC-BB-FRM-003** | Form & Validasi | Upload Format File Didukung (Positif - PDF, DOCX, XLSX) | 1. Unggah berkas file `.pdf` / `.docx`<br>2. Klik Submit | File: `SOP_2026.pdf` | Sistem berhasil memproses unggahan file dan mendeteksi tipe file secara otomatis. | | |
| **TC-BB-FRM-004** | Form & Validasi | Upload Format File Tidak Didukung (Negatif - Executable `.exe`) | 1. Unggah file bermasalah seperti `.exe` / `.bat`<br>2. Klik Submit | File: `virus.exe` | Sistem memblokir pengunggahan file dan menampilkan error *"Format file tidak didukung"*. | | |
