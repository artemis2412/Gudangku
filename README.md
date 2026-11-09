# GUDANGKU

Aplikasi manajemen persediaan untuk Web dan Android Native.

## Platform
- Web: Next.js + TypeScript
- Android: Kotlin native
- Backend: Supabase (PostgreSQL, Auth, Row Level Security)
- Repository: satu repo, dua codebase aplikasi

## Struktur
```
web/                 Aplikasi web
android/             Aplikasi Android Native
supabase/            Konfigurasi dan migrasi database
docs/                Dokumentasi arsitektur dan pengembangan
```

## Backend
GUDANGKU memakai proyek Supabase khusus yang terpisah dari proyek Supabase aplikasi lain.

Buat `web/.env.local` berdasarkan `web/.env.example`. Jangan pernah commit file environment berisi kredensial.

## Modul Web yang tersedia
- Organisasi dan akses anggota.
- Master kategori, satuan, produk, gudang, pelanggan, dan pemasok.
- Barang masuk, barang keluar/penjualan, transfer, saldo, kartu stok, dan stock opname.
- Pembayaran piutang pelanggan dan utang pemasok.
- Retur penjualan/pembelian beserta penyelesaian nilainya.
- Laporan pembelian, penjualan, dan persediaan.

## Keamanan
- Jangan commit Supabase service-role key, access token, signing secret, atau password.
- Client hanya boleh menggunakan Supabase URL dan anon/publishable key.
- Aktifkan dan pertahankan RLS pada tabel yang terekspos.
- Validasi operasi stok penting di backend/database, bukan hanya di UI.

Lihat `docs/DEVELOPMENT.md` untuk panduan berikutnya.
