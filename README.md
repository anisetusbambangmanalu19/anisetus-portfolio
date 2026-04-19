# Portofolio Personal - Anisetus Bambang Manalu

Website portofolio dibangun dengan HTML, CSS, dan JavaScript. Proyek ini siap dipublikasikan gratis melalui GitHub Pages.

## Tech Stack
- HTML5
- CSS3
- Vanilla JavaScript
- GitHub Actions (auto deploy)

## Pratinjau Lokal
Kamu bisa membuka `index.html` langsung di browser, atau memakai server lokal sederhana.

### Menjalankan di Lokal (Windows PowerShell)
1. Buka terminal di folder proyek.
2. Jalankan perintah ini:

```powershell
python -m http.server 5500
```

3. Buka browser:
`http://localhost:5500`

## Setup Admin Supabase
Portofolio ini sekarang mendukung fitur mini-CMS: edit konten profil, CRUD proyek, dan gambar galeri proyek.

### 1) Buat Project Supabase
- Buat project baru di Supabase.
- Buka SQL Editor dan jalankan `supabase-setup.sql`.

### 2) Aktifkan GitHub OAuth di Supabase
- Buka Authentication -> Sign In / Providers -> GitHub.
- Isi GitHub OAuth App Client ID dan Client Secret.
- Simpan pengaturan provider.

### 3) Konfigurasi Frontend
- Buka `supabase-config.js`.
- Isi `url` dan `anonKey` dari Project Settings -> API.

### 4) Pakai Dashboard Admin
- Buka `admin.html`.
- Login menggunakan GitHub OAuth.
- Update foto profil dan konten homepage (hero, fokus, about).
- Tambah, edit, dan hapus proyek.
- Upload cover image dan beberapa gambar galeri.
- Hapus gambar galeri dari proyek yang sudah ada.

### 5) Portofolio Publik
- `index.html` akan otomatis memuat proyek yang sudah dipublish dari tabel Supabase `projects`.
- `index.html` juga akan memuat konten profil dari tabel `site_settings`.
- Jika konfigurasi Supabase kosong, sistem akan fallback ke repository GitHub.
