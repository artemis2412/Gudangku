import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CatalogSettingsForm } from "./catalog-settings-form";

export default async function CatalogSettingsPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: membership } = await supabase.from("organization_members").select("role,organizations(name)")
    .eq("organization_id", organizationId).eq("user_id", userId).maybeSingle();
  if (!membership?.organizations) notFound();
  const organization = membership.organizations as unknown as { name: string };
  const [categories, units] = await Promise.all([
    supabase.from("product_categories").select("id,name,description").eq("organization_id", organizationId).order("name"),
    supabase.from("units").select("id,name,abbreviation").eq("organization_id", organizationId).order("name"),
  ]);
  const canManage = ["owner", "admin", "manager"].includes(membership.role);
  return <main className="dashboard-shell">
    <header className="dashboard-topbar"><Link href="/" className="brand"><span className="brand-mark">G</span><span>GUDANGKU</span></Link><Link href={`/dashboard/${organizationId}`} className="text-button">Kembali ke dashboard</Link></header>
    <section className="dashboard-heading"><p className="eyebrow">MASTER DATA · PENGATURAN</p><h1>Kategori & satuan</h1><p className="auth-description">Atur klasifikasi barang dan satuan untuk {organization.name}.</p></section>
    <section className="master-layout">
      <article className="data-panel"><div className="panel-section-heading"><div><p className="eyebrow">KATEGORI PRODUK</p><h2>Daftar kategori</h2></div><span className="panel-count">{categories.data?.length ?? 0} kategori</span></div>
        {categories.error && <p className="form-error">Kategori gagal dimuat.</p>}
        {categories.data?.length ? <div className="master-list">{categories.data.map(item => <div className="master-row" key={item.id}><div><strong>{item.name}</strong><small>{item.description || "Tanpa deskripsi"}</small></div></div>)}</div> : <p className="empty-note">Belum ada kategori.</p>}
        {canManage && <CatalogSettingsForm organizationId={organizationId} kind="category"/>}
      </article>
      <article className="data-panel"><div className="panel-section-heading"><div><p className="eyebrow">SATUAN BARANG</p><h2>Daftar satuan</h2></div><span className="panel-count">{units.data?.length ?? 0} satuan</span></div>
        {units.error && <p className="form-error">Satuan gagal dimuat.</p>}
        {units.data?.length ? <div className="master-list">{units.data.map(item => <div className="master-row" key={item.id}><div><strong>{item.name}</strong><small>Singkatan: {item.abbreviation}</small></div></div>)}</div> : <p className="empty-note">Belum ada satuan.</p>}
        {canManage && <CatalogSettingsForm organizationId={organizationId} kind="unit"/>}
      </article>
    </section>
  </main>;
}
