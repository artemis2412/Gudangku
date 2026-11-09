import Link from "next/link";
import {notFound,redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {SupplierForm} from "./supplier-form";
type Supplier={id:string;code:string|null;name:string;contact_person:string|null;phone:string|null;email:string|null;address:string|null;is_active:boolean};
export default async function SuppliersPage({params}:{params:Promise<{organizationId:string}>}){
 const {organizationId}=await params;const supabase=await createClient();const {data:claims}=await supabase.auth.getClaims();const userId=claims?.claims?.sub;if(!userId)redirect("/login");
 const {data:member}=await supabase.from("organization_members").select("role,organizations(name)").eq("organization_id",organizationId).eq("user_id",userId).maybeSingle();
 if(!member?.organizations)notFound();const org=member.organizations as unknown as {name:string};
 const {data,error}=await supabase.from("suppliers").select("id,code,name,contact_person,phone,email,address,is_active").eq("organization_id",organizationId).order("name").limit(500);
 const canManage=["owner","admin","manager"].includes(member.role);
 return <main className="dashboard-shell">
 <header className="dashboard-topbar"><Link href="/" className="brand"><span className="brand-mark">G</span><span>GUDANGKU</span></Link><Link href={`/dashboard/${organizationId}`} className="text-button">Kembali ke dashboard</Link></header>
 <section className="dashboard-heading"><p className="eyebrow">MASTER DATA · PEMASOK</p><h1>Supplier</h1><p className="auth-description">Kelola pemasok barang untuk {org.name}. Supplier dapat dipilih saat mencatat pembelian.</p></section>
 <section className="master-layout"><article className="data-panel"><div className="panel-section-heading"><div><p className="eyebrow">DAFTAR PEMASOK</p><h2>Semua supplier</h2></div><span className="panel-count">{data?.length??0} supplier</span></div>
 {error&&<p className="form-error">Daftar supplier gagal dimuat.</p>}
 {data?.length?<div className="product-table-wrap"><table className="product-table"><thead><tr><th>Nama supplier</th><th>Kode</th><th>Kontak</th><th>Telepon</th><th>Status</th></tr></thead><tbody>{(data as Supplier[]).map(s=><tr key={s.id}><td><strong>{s.name}</strong><br/>{s.email??""}</td><td>{s.code??"—"}</td><td>{s.contact_person??"—"}</td><td>{s.phone??"—"}</td><td><span className={s.is_active?"status-active":"status-inactive"}>{s.is_active?"Aktif":"Nonaktif"}</span></td></tr>)}</tbody></table></div>:<p className="empty-note">Belum ada supplier. Tambahkan pemasok pertama.</p>}
 </article>
 {canManage&&<article className="data-panel"><p className="eyebrow">TAMBAH PEMASOK</p><h2 className="form-panel-title">Supplier baru</h2><SupplierForm organizationId={organizationId}/></article>}
 </section></main>;
}
