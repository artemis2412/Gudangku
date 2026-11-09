import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type Balance = {
  warehouse_id: string; product_id: string; quantity: number | string;
  products: { name: string; sku: string | null; minimum_stock: number | string } | null;
  warehouses: { name: string; code: string } | null;
};
const fmt = (v: number | string) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(Number(v ?? 0));

export default async function StockBalancesPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: membership } = await supabase.from("organization_members").select("organizations(name)")
    .eq("organization_id", organizationId).eq("user_id", userId).maybeSingle();
  if (!membership?.organizations) notFound();
  const organization = membership.organizations as unknown as { name: string };
  const { data, error } = await supabase.from("stock_balances")
    .select("warehouse_id, product_id, quantity, products(name, sku, minimum_stock), warehouses(name, code)")
    .eq("organization_id", organizationId).order("updated_at", { ascending: false }).limit(5000);
  const balances = (data ?? []) as unknown as Balance[];
  const total = balances.reduce((sum, row) => sum + Number(row.quantity), 0);
  const totalByProduct = new Map<string, number>();
  for (const row of balances) totalByProduct.set(row.product_id, (totalByProduct.get(row.product_id) ?? 0) + Number(row.quantity));
  const lowProductIds = new Set(balances.filter(row => Number(row.products?.minimum_stock ?? 0) > 0 && (totalByProduct.get(row.product_id) ?? 0) <= Number(row.products?.minimum_stock ?? 0)).map(row => row.product_id));
  const low = lowProductIds.size;
  return <main className="dashboard-shell">
    <header className="dashboard-topbar"><Link href="/" className="brand"><span className="brand-mark">G</span><span>GUDANGKU</span></Link><Link href={`/dashboard/${organizationId}`} className="text-button">Kembali ke dashboard</Link></header>
    <section className="dashboard-heading"><p className="eyebrow">PERSEDIAAN · SALDO</p><h1>Saldo stok</h1><p className="auth-description">Posisi stok per produk dan gudang untuk {organization.name}.</p></section>
    {error && <p className="form-error">Saldo stok gagal dimuat. Periksa koneksi database.</p>}
    <section className="metric-grid balance-metrics"><article className="metric-card"><span>TOTAL UNIT</span><strong>{fmt(total)}</strong><small>Akumulasi saldo semua gudang</small></article><article className="metric-card"><span>BARIS SALDO</span><strong>{fmt(balances.length)}</strong><small>Kombinasi produk dan gudang</small></article><article className="metric-card metric-alert"><span>SALDO MENIPIS</span><strong>{fmt(low)}</strong><small>Di bawah batas minimum produk</small></article></section>
    <article className="data-panel balance-panel"><div className="panel-section-heading"><div><p className="eyebrow">RINCIAN PERSEDIAAN</p><h2>Stok per gudang</h2></div><span className="panel-count">{balances.length} baris</span></div>
      {balances.length ? <div className="product-table-wrap"><table className="product-table"><thead><tr><th>Produk</th><th>Gudang</th><th>SKU</th><th>Jumlah</th><th>Stok minimum</th><th>Kondisi total produk</th></tr></thead><tbody>{balances.map(row => { const isLow = lowProductIds.has(row.product_id); return <tr key={row.warehouse_id + row.product_id}><td><strong>{row.products?.name ?? "Produk"}</strong></td><td>{row.warehouses?.name ?? "Gudang"}</td><td>{row.products?.sku ?? "—"}</td><td><strong>{fmt(row.quantity)}</strong></td><td>{fmt(row.products?.minimum_stock ?? 0)}</td><td><span className={isLow ? "status-inactive" : "status-active"}>{isLow ? "Menipis" : "Aman"}</span></td></tr>; })}</tbody></table></div> : <p className="empty-note">Belum ada saldo stok. Buat transaksi barang masuk dan lakukan posting untuk mulai mengisi saldo.</p>}
    </article>
  </main>;
}
