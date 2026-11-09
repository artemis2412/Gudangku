import Link from "next/link";

const modules = [
  { code: "01", title: "Produk", description: "Data barang, kategori, dan satuan." },
  { code: "02", title: "Stok masuk", description: "Catat penerimaan barang dari pemasok." },
  { code: "03", title: "Stok keluar", description: "Pantau barang keluar dan alasannya." },
  { code: "04", title: "Mutasi gudang", description: "Pindahkan stok antar lokasi gudang." },
  { code: "05", title: "Stok opname", description: "Cocokkan stok fisik dengan catatan." },
  { code: "06", title: "Riwayat stok", description: "Telusuri pergerakan dan audit aktivitas." },
];

export default function HomePage() {
  return (
    <main className="shell">
      <header className="topbar">
        <Link className="brand" href="/" aria-label="GUDANGKU beranda">
          <span className="brand-mark">G</span>
          <span>GUDANGKU</span>
        </Link>
        <div className="topbar-actions"><span className="environment">INTERNAL PREVIEW</span><Link className="text-button" href="/login">Masuk</Link></div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">INVENTORY MANAGEMENT SYSTEM</p>
          <h1>Semua stok,<br /><span>satu kendali.</span></h1>
          <p className="hero-description">
            Kelola produk, pergerakan barang, dan persediaan gudang dalam satu tempat.
            Dibangun untuk pencatatan yang jelas dan kontrol stok yang lebih rapi.
          </p>
          <div className="hero-actions">
            <a className="primary-button" href="#modul">Jelajahi modul <span aria-hidden="true">↗</span></a>
            <span className="status-note"><i /> Fondasi aplikasi disiapkan</span>
          </div>
        </div>
        <div className="hero-panel" aria-label="Ringkasan modul persediaan">
          <div className="panel-head"><span>OVERVIEW</span><span className="panel-dot" /></div>
          <div className="panel-title">Kontrol persediaan</div>
          <div className="panel-subtitle">Satu alur untuk seluruh aktivitas gudang.</div>
          <div className="flow">
            <div className="flow-step"><b>IN</b><span>Penerimaan</span><small>Stok masuk</small></div>
            <div className="flow-line" />
            <div className="flow-step flow-main"><b>▦</b><span>Persediaan</span><small>Saldo stok</small></div>
            <div className="flow-line" />
            <div className="flow-step"><b>OUT</b><span>Pengeluaran</span><small>Stok keluar</small></div>
          </div>
          <div className="panel-foot"><span>Multi-gudang</span><span>•</span><span>Riwayat tercatat</span><span>•</span><span>Berbasis peran</span></div>
        </div>
      </section>

      <section className="modules" id="modul">
        <div className="section-heading">
          <div><p className="eyebrow">RUANG KERJA</p><h2>Modul utama</h2></div>
          <p>Fondasi fitur yang akan dikembangkan bertahap.</p>
        </div>
        <div className="module-grid">
          {modules.map((module) => (
            <article className="module-card" key={module.code}>
              <span className="module-code">{module.code}</span>
              <h3>{module.title}</h3>
              <p>{module.description}</p>
              <span className="module-arrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>
      <footer><span>GUDANGKU</span><span>Web · Android Native · Supabase</span></footer>
    </main>
  );
}
