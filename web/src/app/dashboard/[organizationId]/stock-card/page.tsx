import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StockCardFilters } from "./stock-card-filters";

export default async function StockCardPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: membership } = await supabase.from("organization_members").select("organizations(name)")
    .eq("organization_id", organizationId).eq("user_id", userId).maybeSingle();
  if (!membership?.organizations) notFound();
  const organization = membership.organizations as unknown as { name: string };
  const [movements, products, warehouses] = await Promise.all([
    supabase.from("stock_movements").select("id,movement_type,quantity_delta,unit_cost,occurred_at,products(id,name,sku),warehouses(id,name,code),stock_documents(id,document_number,document_type,status),stock_counts(id,count_number,status)")
      .eq("organization_id", organizationId).order("occurred_at", { ascending: false }).limit(1000),
    supabase.from("products").select("id,name,sku").eq("organization_id", organizationId).order("name").limit(1000),
    supabase.from("warehouses").select("id,name,code").eq("organization_id", organizationId).order("name"),
  ]);
  return <main className="dashboard-shell">
    <header className="dashboard-topbar"><Link href="/" className="brand"><span className="brand-mark">G</span><span>GUDANGKU</span></Link><Link href={`/dashboard/${organizationId}`} className="text-button">Kembali ke dashboard</Link></header>
    <section className="dashboard-heading"><p className="eyebrow">PERSEDIAAN · AUDIT TRAIL</p><h1>Kartu stok</h1><p className="auth-description">Telusuri riwayat pergerakan barang untuk {organization.name}.</p></section>
    {movements.error && <p className="form-error">Riwayat pergerakan gagal dimuat.</p>}
    <article className="data-panel stock-card-panel"><div className="panel-section-heading"><div><p className="eyebrow">RIWAYAT PERGERAKAN</p><h2>Mutasi stok</h2></div><span className="panel-count">{movements.data?.length ?? 0} mutasi</span></div>
      <StockCardFilters movements={(movements.data ?? []) as unknown as Array<Record<string, unknown>>} products={products.data ?? []} warehouses={warehouses.data ?? []}/>
    </article>
  </main>;
}
