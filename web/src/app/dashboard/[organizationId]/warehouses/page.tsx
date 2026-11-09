import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WarehouseForm } from "./warehouse-form";

type Warehouse = { id: string; code: string; name: string; address: string | null; is_active: boolean };

export default async function WarehousesPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: membership } = await supabase.from("organization_members")
    .select("role, organizations(name)").eq("organization_id", organizationId).eq("user_id", userId).maybeSingle();
  if (!membership?.organizations) notFound();
  const organization = membership.organizations as unknown as { name: string };
  const { data, error } = await supabase.from("warehouses")
    .select("id, code, name, address, is_active").eq("organization_id", organizationId)
    .order("name", { ascending: true });
  const canManage = ["owner", "admin", "manager"].includes(membership.role);
  return <main className="dashboard-shell">
    <header className="dashboard-topbar"><Link href="/" className="brand"><span className="brand-mark">G</span><span>GUDANGKU</span></Link><Link href={`/dashboard/${organizationId}`} className="text-button">Kembali ke dashboard</Link></header>
    <section className="dashboard-heading"><p className="eyebrow">MASTER DATA · LOKASI</p><h1>Gudang</h1><p className="auth-description">Kelola lokasi penyimpanan untuk {organization.name}.</p></section>
    {error && <p className="form-error">Data gudang gagal dimuat. Periksa koneksi database.</p>}
    <section className="master-layout">
      <article className="data-panel"><div className="panel-section-heading"><div><p className="eyebrow">DAFTAR LOKASI</p><h2>Semua gudang</h2></div><span className="panel-count">{data?.length ?? 0} gudang</span></div>
      {data?.length ? <div className="master-list">{(data as Warehouse[]).map(item => <div className="master-row" key={item.id}><div><strong>{item.name}</strong><small>{item.code} · {item.address || "Alamat belum diisi"}</small></div><span className={item.is_active ? "status-active" : "status-inactive"}>{item.is_active ? "Aktif" : "Nonaktif"}</span></div>)}</div> : <p className="empty-note">Belum ada gudang. Tambahkan lokasi pertama untuk mulai mengelola stok.</p>}</article>
      {canManage && <article className="data-panel"><p className="eyebrow">TAMBAH LOKASI</p><h2 className="form-panel-title">Gudang baru</h2><WarehouseForm organizationId={organizationId}/></article>}
    </section>
  </main>;
}
