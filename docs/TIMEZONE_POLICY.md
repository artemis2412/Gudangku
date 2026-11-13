# Kebijakan Zona Waktu

## Keputusan produk

GUDANGKU tidak meminta pengguna memilih WIB, WITA, atau WIT secara manual. Zona waktu dideteksi otomatis dari pengaturan perangkat/browser menggunakan IANA time zone ID, misalnya `Asia/Jakarta`, `Asia/Makassar`, atau `Asia/Jayapura`.

## Aturan penyimpanan dan tampilan

- Simpan seluruh timestamp kejadian di database sebagai `timestamptz` (UTC secara internal).
- Jangan menyimpan waktu transaksi sebagai teks atau timestamp tanpa zona waktu.
- Setiap lokasi operasional/cabang memiliki `time_zone` berupa IANA time zone ID.
- Saat lokasi dibuat, isi zona waktu awal dari `Intl.DateTimeFormat().resolvedOptions().timeZone` pada perangkat. Pengguna tidak perlu mengetiknya.
- Jika deteksi perangkat gagal, gunakan `Asia/Jakarta` sebagai fallback awal dan izinkan pemilik memperbarui zona waktu lokasi melalui pengaturan lokasi.
- Tampilan tanggal, jam, batas awal/akhir hari, dan laporan harian harus memakai zona waktu lokasi yang dipilih, bukan zona waktu server.
- Saat pemilik mengakses cabang dari wilayah lain, laporan cabang tetap memakai zona waktu cabang. Zona waktu perangkat tidak boleh menggeser tanggal transaksi cabang.
- Android Native membaca zona waktu perangkat dari sistem Android. Web membaca zona waktu browser. Keduanya mengikuti kebijakan yang sama.
- Tidak perlu meminta izin GPS/lokasi hanya untuk mengetahui zona waktu.

## Catatan implementasi

Sebelum fitur ini diaktifkan di produksi, tambahkan kolom zona waktu pada tabel lokasi yang menjadi sumber kebenaran cabang, lalu migrasikan data lama dengan fallback yang ditinjau pemilik. Pastikan semua query laporan harian menggunakan rentang waktu yang dihitung untuk zona waktu lokasi. Jangan mengubah timestamp transaksi lama saat migrasi.

## Contoh

- Banjarmasin: `Asia/Makassar` (WITA)
- Jakarta: `Asia/Jakarta` (WIB)
- Jayapura: `Asia/Jayapura` (WIT)

Jika perangkat pemilik berada di Jakarta tetapi sedang membuka cabang Banjarmasin, transaksi dan laporan cabang Banjarmasin tetap ditampilkan menurut WITA.
