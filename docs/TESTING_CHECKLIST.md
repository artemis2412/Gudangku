# GUDANGKU — Checklist Pengujian

Dokumen ini dipakai untuk pengujian bertahap sebelum GUDANGKU dipakai untuk transaksi nyata.

## 1. Persiapan lingkungan
- [ ] Gunakan proyek Supabase khusus GUDANGKU.
- [ ] Buat akun pengujian Owner, Admin, Manager, dan Staff.
- [ ] Buat satu organisasi uji dengan minimal dua gudang.
- [ ] Buat kategori, satuan, produk, pelanggan, dan pemasok uji.
- [ ] Catat stok awal setiap produk sebelum transaksi.
- [ ] Jangan gunakan data usaha nyata untuk pengujian awal.

## 2. Autentikasi dan isolasi organisasi
- [ ] Registrasi dan login berhasil.
- [ ] Logout mengakhiri sesi.
- [ ] Halaman dashboard tanpa login mengarahkan pengguna ke login.
- [ ] Anggota organisasi A tidak dapat membaca atau mengubah data organisasi B.
- [ ] Staff tidak dapat menjalankan tindakan khusus Manager/Owner.
- [ ] Pengguna yang bukan anggota organisasi tidak dapat mengakses API organisasi tersebut.

## 3. Master data
- [ ] Tambah dan ubah gudang.
- [ ] Tambah produk dengan SKU dan barcode.
- [ ] Simpan produk dengan satuan dasar PCS.
- [ ] Simpan ukuran dus dan harga jual PCS/DUS.
- [ ] Tolak ukuran dus nol atau negatif.
- [ ] Tolak harga dan stok minimum negatif.
- [ ] Produk dari organisasi lain tidak dapat dipilih.
- [ ] Tambah kategori dan satuan berhasil.
- [ ] Edit nama/deskripsi kategori berhasil.
- [ ] Edit nama/singkatan satuan berhasil.
- [ ] Kategori yang sedang dipakai produk tidak dapat dihapus.
- [ ] Satuan yang sedang dipakai produk tidak dapat dihapus.
- [ ] Staff hanya dapat melihat kategori/satuan dan tidak melihat kontrol edit/hapus.

## 4. Barang masuk (IN)
- [ ] Buat draft barang masuk.
- [ ] Draft tidak mengubah saldo stok.
- [ ] Posting barang masuk menambah stok tepat sesuai kuantitas.
- [ ] Harga beli dan pemasok tersimpan.
- [ ] Posting ulang dokumen ditolak.
- [ ] Dokumen dari gudang organisasi lain ditolak.

## 5. Barang keluar / penjualan (OUT)
- [ ] Buat draft penjualan PCS.
- [ ] Buat draft penjualan DUS dan konversi ke satuan dasar benar.
- [ ] Diskon mengurangi total secara benar.
- [ ] Metode pembayaran CASH, BANK_TRANSFER, QRIS, dan CREDIT tervalidasi.
- [ ] Uang diterima dan kembalian dihitung benar.
- [ ] Pembayaran kurang menghasilkan status PARTIAL/UNPAID yang benar.
- [ ] Draft tidak mengurangi stok.
- [ ] Posting mengurangi stok tepat satu kali.
- [ ] Stok tidak boleh menjadi negatif.
- [ ] Struk menampilkan item, harga, diskon, total, pembayaran, dan kembalian.

## 6. Piutang pelanggan
- [ ] Penjualan kredit menghasilkan sisa tagihan.
- [ ] Pembayaran sebagian memperbarui saldo piutang.
- [ ] Pembayaran pelunasan mengubah status menjadi PAID.
- [ ] Pembayaran melebihi sisa tagihan ditolak.
- [ ] Pembayaran pada dokumen yang belum POSTED ditolak.

## 7. Barang keluar/masuk antar gudang (TRANSFER)
- [ ] Transfer mengurangi stok gudang asal.
- [ ] Transfer menambah stok gudang tujuan dengan jumlah sama.
- [ ] Transfer gagal jika stok gudang asal tidak cukup.
- [ ] Transfer tidak boleh menggunakan gudang yang tidak aktif atau lintas organisasi.

## 8. Stock opname
- [ ] Buat draft opname dengan snapshot stok sistem.
- [ ] Draft opname tidak mengubah saldo.
- [ ] Selisih positif menambah stok.
- [ ] Selisih negatif mengurangi stok.
- [ ] Opname ditolak jika stok berubah setelah snapshot dibuat.
- [ ] Opname yang sudah selesai tidak dapat diselesaikan ulang.

## 9. Pembelian dan utang pemasok
- [ ] Barang masuk dengan pemasok tersimpan benar.
- [ ] Pembelian tunai dan kredit menghitung status pembayaran benar.
- [ ] Pembayaran sebagian dan pelunasan memperbarui utang.
- [ ] Pembayaran melebihi sisa utang ditolak.
- [ ] Riwayat pembayaran pemasok tampil pada dokumen.

## 10. Retur penjualan dan pembelian
- [ ] Retur penjualan hanya merujuk dokumen OUT yang sudah POSTED.
- [ ] Retur pembelian hanya merujuk dokumen IN yang sudah POSTED.
- [ ] Kuantitas retur tidak boleh melebihi kuantitas terjual/dibeli dikurangi retur sebelumnya.
- [ ] Retur penjualan menambah stok.
- [ ] Retur pembelian mengurangi stok dan ditolak jika stok tidak cukup.
- [ ] Nilai retur memperhitungkan diskon transaksi asal secara proporsional.
- [ ] Draft retur tidak mengubah stok.
- [ ] Posting retur hanya dapat dilakukan sekali.
- [ ] Pengembalian uang/settlement sebagian dan penuh menghitung sisa dengan benar.
- [ ] Settlement melebihi nilai retur ditolak.


## 11. Laporan
- [ ] Filter tanggal awal dan akhir pada laporan penjualan berfungsi.
- [ ] Filter pelanggan pada laporan penjualan hanya menampilkan transaksi pelanggan terpilih.
- [ ] Filter tanggal awal dan akhir pada laporan pembelian berfungsi.
- [ ] Filter supplier pada laporan pembelian hanya menampilkan transaksi supplier terpilih.
- [ ] Total, diskon, pembayaran diterima, piutang, dan utang cocok dengan dokumen sumber.
- [ ] Transaksi draft dan transaksi yang dibatalkan tidak masuk laporan.

## 12. Hak akses RPC transaksi
- [ ] Pengguna anonim tidak dapat memanggil RPC posting transaksi stok.
- [ ] Pengguna anonim tidak dapat menyelesaikan stock opname.
- [ ] Pengguna anonim tidak dapat mencatat pembayaran pelanggan/supplier atau penyelesaian retur.
- [ ] Pengguna login tanpa keanggotaan organisasi tidak dapat menjalankan operasi transaksi organisasi tersebut.
- [ ] Staff dapat membuat draft dan mencatat pembayaran sesuai haknya, tetapi tidak dapat memposting dokumen, menyelesaikan opname, atau memposting retur.
- [ ] Owner/admin/manager dapat memposting transaksi, menyelesaikan opname, dan memposting retur.

## 13. Audit dan konsistensi
- [ ] Setiap posting transaksi menghasilkan stock movement.
- [ ] Setiap penyesuaian opname menghasilkan movement.
- [ ] Setiap retur menghasilkan movement dengan sumber retur.
- [ ] Riwayat stok cocok dengan saldo akhir.
- [ ] Audit log mencatat tindakan penting.
- [ ] Refresh halaman tidak menghilangkan sesi yang valid.

## 14. Kriteria siap uji coba terbatas
- [ ] Workflow GitHub Actions lulus lint, typecheck, dan build.
- [ ] Seluruh skenario kritis di atas lulus pada lingkungan uji.
- [ ] Uji dua organisasi memastikan isolasi data.
- [ ] Uji dua pengguna berbeda memastikan hak akses.
- [ ] Backup dan prosedur pemulihan database disiapkan.
- [ ] Tidak ada kredensial rahasia di repository.

> Status saat ini: checklist disiapkan sebagai rencana QA. Jangan tandai skenario sebagai lulus sebelum benar-benar dijalankan pada lingkungan uji.
