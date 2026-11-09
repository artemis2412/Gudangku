import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  minimum_stock: number | string;
  is_active: boolean;
};
type BalanceRow = { product_id: string; quantity: number | string };
type MovementRow = {
  id: string;
  movement_type: string;
  quantity_delta: number | string;
  occurred_at: string;
  products: { name: string; sku: string | null } | null;
  warehouses: { name: string } | null;
  stock_documents: { document_number: string } | null;
  stock_returns: { return_number: string } | null;
};

const number = (value: number | string | null | undefined) => Number(value ?? 0);
const formatNumber = (value: number) =>
  new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value);
const formatDate = (value: string) =>
  new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export default async function OrganizationWorkspace({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, organizations(id, name)")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership?.organizations) notFound();
  const organization = membership.organizations as unknown as { id: string; name: string };

  const [productsResult, warehousesResult, balancesResult, movementsResult] = await Promise.all([
    supabase.from("products").select("id, name, sku, minimum_stock, is_active", { count: "exact" })
      .eq("organization_id", organizationId).eq("is_active", true).limit(1000),
    supabase.from("warehouses").select("id", { count: "exact", head: true })
      .eq("organization_id", organizationId).eq("is_active", true),
    supabase.from("stock_balances").select("product_id, quantity")
      .eq("organization_id", organizationId).limit(5000),
    supabase.from("stock_movements")
      .select("id, movement_type, quantity_delta, occurred_at, products(name, sku), warehouses(name), stock_documents(document_number), stock_returns(return_number)")
      .eq("organization_id", organizationId)
      .order("occurred_at", { ascending: false }).limit(8),
  ]);

  const products = (productsResult.data ?? []) as ProductRow[];
  const balances = (balancesResult.data ?? []) as BalanceRow[];
  const quantityByProduct = new Map<string, number>();
  for (const balance of balances) {
    quantityByProduct.set(balance.product_id, (quantityByProduct.get(balance.product_id) ?? 0) + number(balance.quantity));
  }

  const totalUnits = balances.reduce((sum, row) => sum + number(row.quantity), 0);
  const lowStockProducts = products.filter(product =>
    number(product.minimum_stock) > 0 &&
    (quantityByProduct.get(product.id) ?? 0) <= number(product.minimum_stock)
  ).sort((a, b) => (quantityByProduct.get(a.id) ?? 0) - (quantityByProduct.get(b.id) ?? 0));
  const lowStock = lowStockProducts.slice(0, 6);

  const movements = (movementsResult.data ?? []) as unknown as MovementRow[];
  const dataWarnings = [
    productsResult.error && "produk",
    warehousesResult.error && "gudang",
    balancesResult.error && "saldo stok",
    movementsResult.error && "aktivitas",
  ].filter(Boolean);

  return (
    <main className="dashboard-shell">
      <header className="dashboard-topbar">
        <Link href="/" className="brand"><span className="brand-mark">G</span><span>GUDANGKU</span></Link>
        <div className="topbar-actions"><Link href="/dashboard" className="text-button">Semua organisasi</Link><form action="/auth/signout" method="post"><button className="text-button">Keluar</button></form></div>
      </header>

      <section className="workspace-welcome">
        <div>
          <p className="eyebrow">RINGKASAN PERSEDIAAN</p>
          <h1>{organization.name}</h1>
          <p className="auth-description">Selamat datang kembali. Berikut kondisi persediaan organisasi saat ini.</p>
        </div>
        <span className="role-chip">Peran: {membership.role}</span>
      </section>

      {dataWarnings.length > 0 && (
        <p className="data-warning">Sebagian ringkasan belum dapat dimuat ({dataWarnings.join(", ")}). Periksa izin tabel dan koneksi database.</p>
      )}

      <section className="metric-grid" aria-label="Ringkasan persediaan">
        <article className="metric-card"><span>PRODUK AKTIF</span><strong>{formatNumber(productsResult.count ?? products.length)}</strong><small>Item terdaftar</small></article>
        <article className="metric-card"><span>TOTAL STOK</span><strong>{formatNumber(totalUnits)}</strong><small>Akumulasi seluruh gudang</small></article>
        <article className="metric-card"><span>GUDANG AKTIF</span><strong>{formatNumber(warehousesResult.count ?? 0)}</strong><small>Lokasi penyimpanan</small></article>
        <article className="metric-card metric-alert"><span>STOK MENIPIS</span><strong>{formatNumber(lowStockProducts.length)}</strong><small>Produk pada/bawah batas minimum</small></article>
      </section>

      <section className="dashboard-content-grid">
        <article className="data-panel">
          <div className="panel-section-heading"><div><p className="eyebrow">PERLU DIPERHATIKAN</p><h2>Stok menipis</h2></div><span className="panel-count">{lowStockProducts.length} produk</span></div>
          {lowStock.length ? (
            <div className="stock-list">
              {lowStock.map(product => (
                <div className="stock-row" key={product.id}>
                  <div><strong>{product.name}</strong><small>{product.sku || "Tanpa SKU"}</small></div>
                  <div className="stock-values"><strong>{formatNumber(quantityByProduct.get(product.id) ?? 0)}</strong><small>Min. {formatNumber(number(product.minimum_stock))}</small></div>
                </div>
              ))}
            </div>
          ) : <p className="empty-note">Belum ada produk yang mencapai batas stok minimum.</p>}
        </article>

        <article className="data-panel">
          <div className="panel-section-heading"><div><p className="eyebrow">PEMANTAUAN</p><h2>Aktivitas terbaru</h2></div><span className="panel-count">8 terakhir</span></div>
          {movements.length ? (
            <div className="movement-list">
              {movements.map(movement => {
                const incoming = number(movement.quantity_delta) > 0;
                return <div className="movement-row" key={movement.id}>
                  <span className={incoming ? "movement-icon incoming" : "movement-icon outgoing"}>{incoming ? "↓" : "↑"}</span>
                  <div className="movement-description"><strong>{movement.products?.name ?? "Produk"}</strong><small>{movement.stock_documents?.document_number ?? movement.stock_returns?.return_number ?? movement.movement_type} · {movement.warehouses?.name ?? "Gudang"}</small><small>{formatDate(movement.occurred_at)}</small></div>
                  <strong className={incoming ? "quantity-positive" : "quantity-negative"}>{incoming ? "+" : ""}{formatNumber(number(movement.quantity_delta))}</strong>
                </div>;
              })}
            </div>
          ) : <p className="empty-note">Belum ada pergerakan stok yang tercatat.</p>}
        </article>
      </section>

      <section className="quick-links">
        <div><p className="eyebrow">LANGKAH SELANJUTNYA</p><h2>Kelola persediaan</h2></div>
        <div className="workspace-module-links"><Link href={`/dashboard/${organization.id}/products`}>Kelola produk <span>↗</span></Link><Link href={`/dashboard/${organization.id}/customers`}>Kelola pelanggan <span>↗</span></Link><Link href={`/dashboard/${organization.id}/suppliers`}>Kelola supplier <span>↗</span></Link><Link href={`/dashboard/${organization.id}/master-data`}>Kategori & satuan <span>↗</span></Link><Link href={`/dashboard/${organization.id}/warehouses`}>Kelola gudang <span>↗</span></Link><Link href={`/dashboard/${organization.id}/stock-documents`}>Transaksi stok <span>↗</span></Link><Link href={`/dashboard/${organization.id}/returns`}>Retur barang <span>↗</span></Link><Link href={`/dashboard/${organization.id}/stock-balances`}>Saldo stok <span>↗</span></Link><Link href={`/dashboard/${organization.id}/stock-card`}>Kartu stok <span>↗</span></Link><Link href={`/dashboard/${organization.id}/stock-counts`}>Stock opname <span>↗</span></Link><Link href={`/dashboard/${organization.id}/reports/sales`}>Laporan penjualan <span>↗</span></Link><Link href={`/dashboard/${organization.id}/reports/inventory`}>Laporan stok <span>↗</span></Link><Link href={`/dashboard/${organization.id}/reports/purchases`}>Laporan pembelian <span>↗</span></Link></div><p>Kelola master data dan catat pergerakan stok melalui transaksi masuk, keluar, atau transfer.</p>
      </section>
    </main>
  );
}
