# Pantau Lot — BEI Market Watch Dashboard

Dashboard pasar saham BEI untuk **investor ritel pemula**.
Frontend **Next.js** · Backend **Express** · Database **MySQL** · Data **Yahoo Finance** · AI **Gemini**.
Semua harga berasal dari Yahoo Finance (tidak ada data tiruan).

## Halaman (sidebar, tekan angka 0-9 untuk pindah, "/" untuk AI)
| Tombol | Halaman | Isi |
|---|---|---|
| / | Tanya AI | Bubble obrolan AI + saran proaktif saat ada kejadian penting |
| 1 | Jelajahi | IHSG, ticker, grafik interaktif, analisis emiten, penguat & pelemah |
| 2 | Wishlist | Saham favorit + catatan + harga target (per akun, MySQL) |
| 3 | Screener | Saring harga 1 lot, kinerja, MA20, volatilitas + preset |
| 4 | Portofolio | Catat pembelian simulasi, hitung untung rugi (CRUD, MySQL); isian otomatis + isi dengan kalimat |
| 5 | Radar Lot Modal | Fitur unggulan: modal Rp -> jumlah lot (dan sebaliknya) + kurva nilai modal |
| 6 | Kabar Harian | Ringkasan pasar ditulis AI dari data Yahoo |
| 7 | Mulai di Sini | Istilah dasar & panduan untuk pemula |
| 8 | Papan Sektor | Peta panas rata-rata perubahan per sektor |
| 9 | Bandingkan | Adu kinerja hingga 3 saham/IHSG pada periode yang sama |
| 0 | Kalkulator Lot | Isi lot, lembar, atau nominal; sisanya terhitung otomatis (dua arah) + biaya beli yang diisi sendiri + isi dengan kalimat |

## Struktur folder
```
pantau-lot/
├─ backend/                  Server API (Express, port 4000)
│  ├─ db/schema.sql          Tabel users, wishlist, holdings
│  ├─ scripts/               init-db.mjs (buat database), ai-test.mjs (cek Gemini)
│  └─ src/
│     ├─ server.js           Titik masuk
│     ├─ config/db.js        Koneksi MySQL
│     ├─ middleware/auth.js  Login (JWT cookie)
│     ├─ routes/             auth, wishlist, portfolio, ai, market
│     ├─ services/           yahoo, gemini, analysis
│     └─ data/symbols.js     Daftar saham + sektor (edit di sini)
├─ frontend/                 Tampilan (Next.js, port 3000)
│  ├─ app/                   Halaman: page.js (Jelajahi), wishlist, screener, portofolio, radar, kabar, mulai, sektor, bandingkan
│  ├─ components/            AppShell (sidebar), AiBubble, Gate, LineChart, dll
│  ├─ lib/                   analysis.js, format.js
│  └─ next.config.mjs        Meneruskan /api/* ke backend
├─ package.json              Menjalankan keduanya sekaligus
└─ README.md
```

## Cara menjalankan
1. Pasang **Node.js LTS** dan **MySQL** (XAMPP juga bisa). Pastikan MySQL menyala.
2. Di terminal folder ini: `npm install`
3. Ganti nama `backend/.env.example` menjadi `backend/.env`, lalu isi `DB_PASSWORD` (XAMPP: kosongkan), `JWT_SECRET` (teks acak >= 32 karakter), `GEMINI_API_KEY`, dan `GEMINI_MODEL` (jalankan `npm run ai:test` untuk mencari model yang berfungsi).
4. `npm run db:init` (membuat database + tabel; aman diulang)
5. `npm run dev` lalu buka http://localhost:3000

## Catatan
- Jangan upload `backend/.env` ke GitHub (sudah di .gitignore).
- Yahoo tidak resmi dan tertunda ±10 menit; bila gagal tampil pesan error, bukan data pengganti.
- Status "BEI buka/tutup" hanya perkiraan jam 09.00-16.00 WIB Senin-Jumat, tanpa jeda siang & hari libur.
- Pengelompokan sektor adalah penyederhanaan buatan sendiri, bukan klasifikasi resmi BEI.
- `frontend/lib/analysis.js` dan `backend/src/services/analysis.js` berisi rumus yang sama; jika diubah, ubah keduanya.
- "Isi dengan kalimat" memakai aturan sederhana (bukan AI): kode saham + angka + kata lot/lembar/juta/rb, mis. `beli 3 lot BBCA di 9000`. Hasil bacaan ditampilkan dulu untuk dicek sebelum disimpan.
- Biaya broker/pajak berbeda tiap sekuritas, jadi kolom biaya beli diisi sendiri (bawaan 0%).
- Rumus lot ada di `frontend/lib/lot.js`.
- Edukasi, bukan saran investasi.
