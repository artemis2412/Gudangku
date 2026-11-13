import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StockCountForm } from "./stock-count-form";
import { CompleteStockCountButton } from "./complete-stock-count-button";
import { formatWarehouseDate } from "@/lib/timezone";

type CountRow = { id:string; count_number:string; status:string; counted_at:string; completed_at:string|null; notes:string|null; warehouses:{name:string;code:string;time_zone:string}|null; stock_count_items:{id:string;system_quantity:number|string;counted_quantity:number|string;products:{name:string;sku:string|null}|null}[] };
export default async function StockCountsPage({params}:{params:Promise<{organizationId:string}>}) {
 const {organizationId}=await params; const supabase=await createClient();
 const {data:claimsData}=await supabase.auth.getClaims(); const userId=claimsData?.claims?.sub; if(!userId) redirect("/login");
 const {data:membership}=await supabase.from("organization_members").select("role,organizations(name)").eq("organization_id",organizationId).eq("user_id",userId).maybeSingle();
 if(!membership?.organizations) notFound();
 const org=membership.organizations as unknown as {name:string};
 const [warehouseResult,productResult,balanceResult,countResult]=await Promise.all([
  supabase.from("warehouses").select("id,name,code").eq("organization_id",organizationId).eq("is_active",true).order("name"),
  supabase.from("products").select("id,name,sku").eq("organization_id",organizationId).eq("is_active",true).order("name").limit(500),
  supabase.from("stock_balances").select("warehouse_id,product_id,quantity").eq("organization_id",organizationId).limit(10000),
  supabase.from("stock_counts").select("id,count_number,status,counted_at,completed_at,notes,warehouses(name,code,time_zone),stock_count_items(id,system_quantity,counted_quantity,products(name,sku))").eq("organization_id",organizationId).order("created_at",{ascending:false}).limit(100),
 ]);
 const canCreate=["owner","admin","manager","staff"].includes(membership.role);
 const canComplete=["owner","admin","manager"].includes(membership.role);
 return <main className="dashboard-shell">
  <header className="dashboard-topbar"><Link href="/" className="brand"><span className="brand-mark">G</span><span>GUDANGKU</span></Link><Link href={`/dashboard/${organizationId}`} className="text-button">Kembali ke dashboard</Link></header>
  <section className="dashboard-heading"><p className="eyebrow">PERSEDIAAN · STOCK OPNAME</p><h1>Stock opname</h1><p className="auth-description">Catat jumlah fisik, bandingkan dengan sistem, lalu selesaikan penyesuaian untuk {org.name}.</p></section>
  <section className="master-layout">
   <article className="data-panel"><div className="panel-section-heading"><div><p className="eyebrow">RIWAYAT OPNAME</p><h2>Dokumen opname</h2></div><span className="panel-count">{countResult.data?.length??0} dokumen</span></div>
    {countResult.error&&<p className="form-error">Riwayat opname gagal dimuat.</p>}
    {countResult.data?.length?(<div className="document-list">{(countResult.data as unknown as CountRow[]).map(c=>{
      const variance=c.stock_count_items.reduce((sum,i)=>sum+Number(i.counted_quantity)-Number(i.system_quantity),0);
      return <div className="document-row" key={c.id}><div className="document-main"><div className="document-title"><strong>{c.count_number}</strong><span className={c.status==="COMPLETED"?"status-active":"status-pending"}>{c.status==="COMPLETED"?"Selesai":c.status==="DRAFT"?"Draft":c.status}</span></div><small>{c.warehouses?.code} · {c.warehouses?.name} · {formatWarehouseDate(c.counted_at,c.warehouses?.time_zone??"Asia/Jakarta","medium")}</small><small>{c.stock_count_items.length} produk · Selisih bersih: {new Intl.NumberFormat("id-ID",{maximumFractionDigits:3}).format(variance)}</small>{c.notes&&<small>{c.notes}</small>}</div>{c.status==="DRAFT"&&canComplete&&<CompleteStockCountButton organizationId={organizationId} countId={c.id}/>}</div>
    })}</div>):<p className="empty-note">Belum ada dokumen stock opname.</p>}
   </article>
   {canCreate&&<article className="data-panel"><p className="eyebrow">BUAT DOKUMEN</p><h2 className="form-panel-title">Opname baru</h2>
    {warehouseResult.error||productResult.error||balanceResult.error?<p className="form-error">Data produk atau gudang gagal dimuat.</p>:<StockCountForm organizationId={organizationId} warehouses={warehouseResult.data??[]} products={productResult.data??[]} balances={balanceResult.data??[]}/>}
   </article>}
  </section>
 </main>;
}
