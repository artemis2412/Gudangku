import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CategoryForm } from "./category-form";
import { UnitForm } from "./unit-form";
import { CategoryList } from "./category-list";
import { UnitList } from "./unit-list";

type Category = { id: string; name: string; description: string | null };
type Unit = { id: string; name: string; abbreviation: string };

export default async function MasterDataPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: membership } = await supabase.from("organization_members").select("role, organizations(name)").eq("organization_id", organizationId).eq("user_id", userId).maybeSingle();
  if (!membership?.organizations) notFound();
  const organization = membership.organizations as unknown as { name: string };
  const [categoriesResult, unitsResult] = await Promise.all([
    supabase.from("product_categories").select("id,name,description").eq("organization_id", organizationId).order("name"),
    supabase.from("units").select("id,name,abbreviation").eq("organization_id", organizationId).order("name"),
  ]);
  const canManage = ["owner", "admin", "manager"].includes(membership.role);
  return <main className="dashboard-shell">
    <header className="dashboard-topbar"><Link href="/" className="brand"><span className="brand-mark">G</span><span>GUDANGKU</span></Link><Link href={`/dashboard/${organizationId}`} className="text-button">Kembali ke dashboard</Link></header>
    <section className="dashboard-heading"><p className="eyebrow">MASTER DATA · PENGATURAN</p><h1>Kategori & Satuan</h1><p className="auth-description">Atur kategori barang dan satuan dasar untuk {organization.name}.</p></section>
    {(categoriesResult.error || unitsResult.error) && <p className="form-error">Sebagian data master gagal dimuat. Periksa koneksi database.</p>}
    <section className="master-layout">
      <article className="data-panel"><div className="panel-section-heading"><div><p className="eyebrow">KATEGORI BARANG</p><h2>Daftar kategori</h2></div><span className="panel-count">{categoriesResult.data?.length ?? 0}</span></div>
        {categoriesResult.data?.length ? <CategoryList organizationId={organizationId} items={categoriesResult.data as Category[]} canManage={canManage}/> : <p className="empty-note">Belum ada kategori.</p>}
        {canManage && <><div className="form-divider-label">TAMBAH KATEGORI</div><CategoryForm organizationId={organizationId}/></>}
      </article>
      <article className="data-panel"><div className="panel-section-heading"><div><p className="eyebrow">SATUAN STOK</p><h2>Daftar satuan</h2></div><span className="panel-count">{unitsResult.data?.length ?? 0}</span></div>
        {unitsResult.data?.length ? <UnitList organizationId={organizationId} items={unitsResult.data as Unit[]} canManage={canManage}/> : <p className="empty-note">Belum ada satuan.</p>}
        {canManage && <><div className="form-divider-label">TAMBAH SATUAN</div><UnitForm organizationId={organizationId}/></>}
      </article>
    </section>
  </main>;
}
