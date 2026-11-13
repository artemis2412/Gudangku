import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatWarehouseDate } from "@/lib/timezone";

type Filters={from?:string;to?:string;product?:string;warehouse?:string};
type Movement={id:string;movement_type:string;quantity_delta:number|string;unit_cost:number|string;occurred_at:string;products:{name:string;sku:string|null}|null;warehouses:{name:string;code:string;time_zone:string}|null;stock_documents:{document_number:string;document_type:string}|null;stock_counts:{count_number:string}|null};
type Balance={product_id:string;warehouse_id:string;quantity:number|string;products:{name:string;sku:string|null;purchase_price:number|string}|null;warehouses:{name:string;code:string}|null};
const n=(v:number|string|null|undefined)=>Number(v??0);
const qty=(v:number)=>new Intl.NumberFormat("id-ID",{maximumFractionDigits:3}).format(v);
const money=(v:number)=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(v);
const dt=(v:string)=>new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeStyle:"short"}).format(new Date(v));
const validDate=(v?:string)=>!!v&&/^\\d{4}-\\d{2}-\\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v));

export default async function InventoryReportPage({params,searchParams}:{params:Promise<{organizationId:string}>;searchParams:Promise<Filters>}) {
 const {organizationId}=await params;const f=await searchParams;
 const from=validDate(f.from)?f.from!:"";const to=validDate(f.to)?f.to!:"";const product=f.product??"";const warehouse=f.warehouse??"";
 const supabase=await createClient();const {data:claims}=await supabase.auth.getClaims();const userId=claims?.claims?.sub;if(!userId)redirect("/login");
 const {data:membership}=await supabase.from("organization_members").select("organizations(name)").eq("organization_id",organizationId).eq("user_id",userId).maybeSingle();
 if(!membership?.organizations)notFound();const org=membership.organizations as unknown as {name:string};
 let movementQuery=supabase.from("stock_movements").select("id,movement_type,quantity_delta,unit_cost,occurred_at,products(name,sku),warehouses(name,code,time_zone),stock_documents(document_number,document_type),stock_counts(count_number)").eq("organization_id",organizationId).order("occurred_at",{ascending:false}).limit(1000);
 if(from)movementQuery=movementQuery.gte("occurred_at",`${from}T00:00:00`);
 if(to){const end=new Date(`${to}T00:00:00`);end.setDate(end.getDate()+1);movementQuery=movementQuery.lt("occurred_at",end.toISOString());}
 if(product)movementQuery=movementQuery.eq("product_id",product);
 if(warehouse)movementQuery=movementQuery.eq("warehouse_id",warehouse);
 let balanceQuery=supabase.from("stock_balances").select("product_id,warehouse_id,quantity,products(name,sku,purchase_price),warehouses(name,code)").eq("organization_id",organizationId).limit(10000);
 if(product)balanceQuery=balanceQuery.eq("product_id",product);
 if(warehouse)balanceQuery=balanceQuery.eq("warehouse_id",warehouse);
 const [movementResult,balanceResult,productsResult,warehousesResult]=await Promise.all([
 movementQuery,balanceQuery,
 supabase.from("products").select("id,name,sku").eq("organization_id",organizationId).order("name").limit(1000),
 supabase.from("warehouses").select("id,name,code").eq("organization_id",organizationId).order("name").limit(500)
 ]);
 const movements=(movementResult.data??[]) as unknown as Movement[];const balances=(balanceResult.data??[]) as unknown as Balance[];
 const totalQty=balances.reduce((s,r)=>s+n(r.quantity),0);
 const estimatedValue=balances.reduce((s,r)=>s+n(r.quantity)*n(r.products?.purchase_price),0);
 const incoming=movements.filter(r=>n(r.quantity_delta)>0).reduce((s,r)=>s+n(r.quantity_delta),0);
 const outgoing=movements.filter(r=>n(r.quantity_delta)<0).reduce((s,r)=>s+Math.abs(n(r.quantity_delta)),0);
 const movementValue=movements.reduce((s,r)=>s+Math.abs(n(r.quantity_delta))*n(r.unit_cost),0);
 return <main className="dashboard-shell">
 <header className="dashboard-topbar"><Link href="/" className="brand"><span className="brand-mark">G</span><span>GUDANGKU</span></Link><Link href={`/dashboard/${organizationId}`} className="text-button">Kembali ke dashboard</Link></header>
 <section className="dashboard-heading"><p className="eyebrow">LAPORAN · PERSEDIAAN</p><h1>Laporan stok</h1><p className="auth-description">Ringkasan saldo dan mutasi persediaan untuk {org.name}. Nilai persediaan merupakan estimasi berdasarkan harga beli produk saat ini.</p></section>
 <section className="data-panel report-filter-panel"><form method="get" className="inventory-report-filters">
 <div><label htmlFor="from">Dari tanggal</label><input id="from" name="from" type="date" defaultValue={from}/></div>
 <div><label htmlFor="to">Sampai tanggal</label><input id="to" name="to" type="date" defaultValue={to}/></div>
 <div><label htmlFor="product">Produk</label><select id="product" name="product" defaultValue={product}><option value="">Semua produk</option>{(productsResult.data??[]).map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
 <div><label htmlFor="warehouse">Gudang</label><select id="warehouse" name="warehouse" defaultValue={warehouse}><option value="">Semua gudang</option>{(warehousesResult.data??[]).map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
 <button className="primary-button report-filter-submit" type="submit">Terapkan</button><Link className="text-button report-reset" href={`/dashboard/${organizationId}/reports/inventory`}>Reset</Link>
 </form>
 {movementResult.error&&<p className="form-error">Riwayat mutasi gagal dimuat.</p>}{balanceResult.error&&<p className="form-error">Saldo persediaan gagal dimuat.</p>}
 </section>
 <section className="report-metric-grid">
 <article className="metric-card"><span>TOTAL SALDO</span><strong>{qty(totalQty)}</strong><small>Unit dasar pada filter aktif</small></article>
 <article className="metric-card"><span>ESTIMASI NILAI STOK</span><strong>{money(estimatedValue)}</strong><small>Saldo × harga beli terkini</small></article>
 <article className="metric-card"><span>BARANG MASUK</span><strong>{qty(incoming)}</strong><small>Mutasi positif pada periode</small></article>
 <article className="metric-card metric-alert"><span>BARANG KELUAR</span><strong>{qty(outgoing)}</strong><small>Mutasi negatif pada periode</small></article>
 </section>
 <section className="data-panel sales-report-table-panel"><div className="panel-section-heading"><div><p className="eyebrow">RINCIAN MUTASI</p><h2>Riwayat pergerakan barang</h2></div><span className="panel-count">{movements.length} mutasi</span></div>
 <div className="report-summary-line"><span>Nilai biaya mutasi (indikatif): <strong>{money(movementValue)}</strong></span><span>Saldo saat ini tidak dibatasi tanggal.</span></div>
 {movements.length?<div className="product-table-wrap"><table className="product-table inventory-report-table"><thead><tr><th>Waktu</th><th>Produk</th><th>Gudang</th><th>Jenis mutasi</th><th>Dokumen sumber</th><th>Perubahan</th><th>Biaya/unit</th><th>Nilai mutasi</th></tr></thead><tbody>{movements.map(m=>{const delta=n(m.quantity_delta);const source=m.stock_documents?.document_number??m.stock_counts?.count_number??"Penyesuaian";return <tr key={m.id}><td>{formatWarehouseDate(m.occurred_at,m.warehouses?.time_zone??"Asia/Jakarta")}</td><td><strong>{m.products?.name??"Produk"}</strong><br/>{m.products?.sku??"—"}</td><td>{m.warehouses?.name??"Gudang"}</td><td>{m.movement_type}</td><td>{source}</td><td><strong className={delta>=0?"quantity-positive":"quantity-negative"}>{delta>0?"+":""}{qty(delta)}</strong></td><td>{money(n(m.unit_cost))}</td><td>{money(Math.abs(delta)*n(m.unit_cost))}</td></tr>})}</tbody></table></div>:<p className="empty-note">Tidak ada mutasi stok pada filter ini.</p>}
 {movements.length===1000&&<p className="field-hint">Menampilkan maksimal 1.000 mutasi terbaru. Persempit rentang tanggal untuk hasil yang lebih lengkap.</p>}
 </section>
 </main>;
}
