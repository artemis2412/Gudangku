import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CustomerForm } from "./customer-form";

type Customer = { id: string; code: string | null; name: string; phone: string | null; address: string | null; is_active: boolean };

export default async function CustomersPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: membership } = await supabase.from("organization_members").select("role, organizations(name)")
    .eq("organization_id", organizationId).eq("user_id", userId).maybeSingle();
  if (!membership?.organizations) notFound();
  const organization = membership.organizations as unknown as { name: string };
  const { data: customers, error } = await supabase.from("customers")
    .select("id, code, name, phone, address, is_active").eq("organization_id", organizationId)
    .order("name").limit(500);
  const canCreate = ["owner", "admin", "manager", "staff"].includes(membership.role);
  return <main className="dashboard-shell">
    <header className="dashboard-topbar"><Link href="/" className="brand"><span className="brand-mark">G</span><span>GUDANGKU</span></Link><Link href={`/dashboard/${organizationId}`} className="text-button">Kembali ke dashboard</Link></header>
    <section className="dashboard-heading"><p className="eyebrow">MASTER DATA · PELANGGAN</p><h1>Pelanggan</h1><p className="auth-description">Daftar pelanggan untuk {organization.name}. Data ini dapat dipilih pada transaksi barang keluar.</p></section>
    <section className="master-layout">
      <article className="data-panel"><div className="panel-section-heading"><div><p className="eyebrow">DAFTAR</p><h2>Semua pelanggan</h2></div><span className="panel-count">{customers?.length ?? 0} pelanggan</span></div>
        {error && <p className="form-error">Daftar pelanggan gagal dimuat.</p>}
        {customers?.length ? <div className="product-table-wrap"><table className="product-table"><thead><tr><th>Nama</th><th>Kode</th><th>Telepon</th><th>Alamat</th><th>Status</th></tr></thead><tbody>{(customers as Customer[]).map(customer => <tr key={customer.id}><td><strong>{customer.name}</strong></td><td>{customer.code || "—"}</td><td>{customer.phone || "—"}</td><td>{customer.address || "—"}</td><td><span className={customer.is_active ? "status-active" : "status-inactive"}>{customer.is_active ? "Aktif" : "Nonaktif"}</span></td></tr>)}</tbody></table></div> : <p className="empty-note">Belum ada pelanggan. Tambahkan pelanggan pertama.</p>}
      </article>
      {canCreate && <article className="data-panel"><p className="eyebrow">TAMBAH PELANGGAN</p><h2 className="form-panel-title">Pelanggan baru</h2><CustomerForm organizationId={organizationId}/></article>}
    </section>
  </main>;
}
