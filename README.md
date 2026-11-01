# Content Calendar AI 📅✨

Aplikasi berbasis kecerdasan buatan (AI) untuk membantu pegawai menghasilkan ide konten dan caption media sosial secara otomatis berdasarkan tanggal dan hari penting (Hari Nasional, Internasional, Teknologi, dan Literasi Digital).

Aplikasi ini menggunakan **Next.js (TypeScript + TailwindCSS v4)** di sisi Frontend, **Golang (Gin Framework)** di sisi Backend, **PostgreSQL** untuk Database, dan **Gemini API** sebagai model AI-nya.

---

## 🎨 Desain & UI/UX Premium (Bespoke Aesthetic)
*   **Aesthetic Off-White & Deep Blue**: Palet warna profesional yang bersih, modern, dan tidak membosankan.
*   **Efek Glassmorphism**: Panel kerja melayang transparan bertekstur blur (`backdrop-filter`) untuk kesan premium.
*   **AI Co-Pilot Workspace**: Panel samping interaktif (split-screen dashboard) yang dinamis dengan efek transif dan typewriter ketika memproses data AI.
*   **Visual Status Glowing**: Tag kategori hari besar menggunakan glow halus untuk memudahkan navigasi.

---

## 🛠️ Persyaratan Sistem (Prerequisites)
1.  **Go** (versi 1.21 ke atas) - untuk menjalankan backend secara lokal.
2.  **Node.js** (versi 20 ke atas) & **npm** - untuk menjalankan frontend.
3.  **PostgreSQL** - sebagai database penyimpanan.
4.  **Docker & Docker Compose** (opsional) - untuk deployment kontainer instan.

---

## 🚀 Cara Menjalankan Aplikasi

### Opsi A: Menggunakan Docker Compose (Rekomendasi)
Jika Anda memiliki **Docker Desktop** yang aktif, Anda dapat menjalankan seluruh stack aplikasi dengan satu perintah:

1.  Buka terminal di direktori root project.
2.  Set key Gemini API Anda di environment (opsional, jika kosong sistem akan menggunakan *Mock Content Generator*):
    ```bash
    # Di Windows PowerShell:
    $env:GEMINI_API_KEY="AIzaSy..."
    ```
3.  Jalankan perintah berikut:
    ```bash
    docker compose up --build -d
    ```
4.  Aplikasi dapat diakses di:
    *   **Frontend**: `http://localhost:3000`
    *   **Backend API**: `http://localhost:8080`

---

### Opsi B: Menjalankan Secara Lokal (Manual)

#### 1. Setup Database PostgreSQL
*   Buat database baru bernama `content_calendar` di PostgreSQL lokal Anda.
*   Konfigurasikan detail database di file `.env` di dalam folder `backend/`.

#### 2. Jalankan Backend (Golang)
1.  Masuk ke direktori backend:
    ```bash
    cd backend
    ```
2.  Salin file contoh env dan edit sesuai kredensial Anda:
    ```bash
    cp .env.example .env
    ```
3.  Jalankan server:
    ```bash
    go run main.go
    ```
    *Server backend akan berjalan di `http://localhost:8080` dan otomatis melakukan migrasi skema database serta menyemai (seed) data default.*

#### 3. Jalankan Frontend (Next.js)
1.  Masuk ke direktori frontend:
    ```bash
    cd frontend
    ```
2.  Pasang dependensi:
    ```bash
    npm install
    ```
3.  Jalankan mode development:
    ```bash
    npm run dev
    ```
    *Aplikasi frontend akan berjalan di `http://localhost:3000`.*

---

## 🔑 Kredensial Uji Coba (Demo Account)
Database secara otomatis menyemai (seed) akun pegawai default saat pertama kali dijalankan:
*   **Email**: `admin@contentcalendar.ai`
*   **Kata Sandi**: `password123`

---

## 🤖 Fitur Utama & Cara Penggunaan

1.  **Login Sederhana**: Masuk menggunakan akun di atas. Sesi login diamankan dengan JSON Web Token (JWT).
2.  **Kalender Konten Interaktif**:
    *   Navigasi bulan dan tahun di bagian atas kalender.
    *   Hari-hari penting nasional, internasional, teknologi, dan literasi digital ditandai dengan tag berwarna bersinar (glow).
3.  **AI Co-Pilot Workspace (Panel Kanan)**:
    *   Klik salah satu tanggal di kalender. Panel kanan akan meluncur menampilkan detail hari penting tersebut.
    *   Klik **Generate Ide Konten AI** untuk meminta Gemini merancang 3 topik publikasi lengkap beserta ringkasannya.
    *   Klik **Generate Caption Media Sosial** untuk merancang takarir dengan gaya penulisan formal pemerintah (sesuai standar instansi).
    *   Klik **Simpan Ide Konten ke Riwayat** untuk menyimpan seluruh ide dan caption tersebut ke database.
4.  **Riwayat Ide**:
    *   Lihat daftar postingan yang pernah Anda rancang.
    *   Gunakan fitur pencarian kata kunci secara real-time untuk memfilter riwayat berdasarkan tema atau isi caption.
    *   Tombol salin instan tersedia untuk mempercepat kerja publikasi Anda.

---

## 🛡️ Fail-Safe: Mock AI Content Generator
Jika Anda tidak menyediakan `GEMINI_API_KEY` (atau kuota API Anda habis), sistem backend secara otomatis beralih ke **Mock Content Generator**. Sistem akan tetap menghasilkan ide konten dan caption terstruktur berkualitas tinggi secara dinamis sesuai tema yang dipilih, sehingga proses pengujian fungsionalitas dan antarmuka dapat berjalan lancar tanpa hambatan API!
