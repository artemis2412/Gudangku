import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "./product-form";

type Product = { id: string; name: string; sku: string | null; barcode: string | null; minimum_stock: number | string; purchase_price: number | string; selling_price: number | string; is_active: boolean };
const fmt = (value: number | string) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(Number(value ?? 0));
const money = (value: number | string) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value ?? 0));

export default async function ProductsPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: membership } = await supabase.from("organization_members")
    .select("role, organizations(name)").eq("organization_id", organizationId).eq("user_id", userId).maybeSingle();
  if (!membership?.organizations) notFound();
  const organization = membership.organizations as unknown as { name: string };
  const [productsResult, categoriesResult, unitsResult] = await Promise.all([
    supabase.from("products").select("id, name, sku, barcode, minimum_stock, purchase_price, selling_price, is_active")
      .eq("organization_id", organizationId).order("name", { ascending: true }).limit(500),
    supabase.from("product_categories").select("id, name").eq("organization_id", organizationId).order("name"),
    supabase.from("units").select("id, name, abbreviation").eq("organization_id", organizationId).order("name"),
  ]);
  const canManage = ["owner", "admin", "manager"].includes(membership.role);
  return <main className="dashboard-shell">
    <header className="dashboard-topbar"><Link href="/" className="brand"><span className="brand-mark">G</span><span>GUDANGKU</span></Link><Link href={`/dashboard/${organizationId}`} className="text-button">Kembali ke dashboard</Link></header>
    <section className="dashboard-heading"><p className="eyebrow">MASTER DATA · BARANG</p><h1>Produk</h1><p className="auth-description">Kelola katalog barang untuk {organization.name}.</p></section>
    {productsResult.error && <p className="form-error">Daftar produk gagal dimuat. Periksa koneksi database.</p>}
    <section className="master-layout">
      <article className="data-panel"><div className="panel-section-heading"><div><p className="eyebrow">KATALOG</p><h2>Semua produk</h2></div><span className="panel-count">{productsResult.data?.length ?? 0} produk</span></div>
        {productsResult.data?.length ? <div className="product-table-wrap"><table className="product-table"><thead><tr><th>Produk</th><th>SKU / Barcode</th><th>Stok min.</th><th>Harga jual</th><th>Status</th></tr></thead><tbody>{(productsResult.data as Product[]).map(product => <tr key={product.id}><td><strong>{product.name}</strong></td><td>{product.sku || product.barcode || "—"}</td><td>{fmt(product.minimum_stock)}</td><td>{money(product.selling_price)}</td><td><span className={product.is_active ? "status-active" : "status-inactive"}>{product.is_active ? "Aktif" : "Nonaktif"}</span></td></tr>)}</tbody></table></div> : <p className="empty-note">Belum ada produk. Tambahkan produk pertama ke katalog organisasi.</p>}
      </article>
      {canManage && <article className="data-panel"><p className="eyebrow">TAMBAH BARANG</p><h2 className="form-panel-title">Produk baru</h2><ProductForm organizationId={organizationId} categories={categoriesResult.data ?? []} units={unitsResult.data ?? []}/></article>}
    </section>
  </main>;
}
