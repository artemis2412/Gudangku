import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PrintReceiptButton } from "../../print-receipt-button";

const money=(v:number|string)=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(Number(v??0));
const dateFmt=(v:string)=>new Intl.DateTimeFormat("id-ID",{dateStyle:"long",timeStyle:"short"}).format(new Date(v));
type ReceiptItem={id:string;quantity:number|string;sales_unit:string;sales_quantity:number|string;unit_price:number|string;line_total:number|string;products:{name:string;sku:string|null}|null};

export default async function SalesReceiptPage({params}:{params:Promise<{organizationId:string;documentId:string}>}){
 const {organizationId,documentId}=await params;
 const supabase=await createClient();
 const {data:claimsData}=await supabase.auth.getClaims();
 const userId=claimsData?.claims?.sub;
 if(!userId)redirect("/login");
 const {data:membership}=await supabase.from("organization_members").select("role,organizations(name)").eq("organization_id",organizationId).eq("user_id",userId).maybeSingle();
 if(!membership?.organizations)notFound();
 const {data:doc,error}=await supabase.from("stock_documents").select("id,document_number,document_type,status,occurred_at,notes,reference_number,source_warehouse_id,customer_id,subtotal_amount,discount_amount,grand_total,payment_method,amount_received,change_amount,payment_status,stock_document_items(id,quantity,sales_unit,sales_quantity,unit_price,line_total,products(name,sku))").eq("id",documentId).eq("organization_id",organizationId).maybeSingle();
 if(error||!doc||doc.document_type!=="OUT")notFound();
 const {data:customer}=doc.customer_id?await supabase.from("customers").select("name,phone,address").eq("id",doc.customer_id).eq("organization_id",organizationId).maybeSingle():{data:null};
 const {data:warehouse}=await supabase.from("warehouses").select("name,code,address").eq("id",doc.source_warehouse_id).eq("organization_id",organizationId).maybeSingle();
 const organization=membership.organizations as unknown as {name:string};
 const items=doc.stock_document_items as unknown as ReceiptItem[];
 const method=doc.payment_method==="CASH"?"Tunai":doc.payment_method==="BANK_TRANSFER"?"Transfer bank":doc.payment_method==="QRIS"?"QRIS":"Tempo";
 const status=doc.payment_status==="PAID"?"LUNAS":doc.payment_status==="PARTIAL"?"DIBAYAR SEBAGIAN":"BELUM DIBAYAR";
 return <main className="receipt-page">
  <nav className="receipt-actions no-print"><Link href={`/dashboard/${organizationId}/stock-documents`} className="text-button">← Kembali ke transaksi</Link><PrintReceiptButton/></nav>
  <article className="receipt-paper">
   <header className="receipt-header"><div className="receipt-brand-mark">G</div><div><p className="eyebrow">BUKTI PENJUALAN</p><h1>{organization.name}</h1>{warehouse&&<p>{warehouse.name} · {warehouse.code}</p>}{warehouse?.address&&<p>{warehouse.address}</p>}</div></header>
   <div className="receipt-meta"><div><small>Nomor nota</small><strong>{doc.document_number}</strong></div><div><small>Tanggal</small><strong>{dateFmt(doc.occurred_at)}</strong></div><div><small>Gudang</small><strong>{warehouse?.name??"—"}</strong></div><div><small>Status dokumen</small><strong>{doc.status==="POSTED"?"SUDAH DIPOSTING":"DRAFT — BELUM MENGURANGI STOK"}</strong></div></div>
   {customer&&<section className="receipt-customer"><strong>Pelanggan</strong><span>{customer.name}</span>{customer.phone&&<span>{customer.phone}</span>}{customer.address&&<span>{customer.address}</span>}</section>}
   <div className="receipt-table-wrap"><table className="receipt-table"><thead><tr><th>Barang</th><th>Jumlah</th><th>Harga</th><th>Subtotal</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td><strong>{item.products?.name??"Produk"}</strong>{item.products?.sku&&<small>SKU: {item.products.sku}</small>}</td><td>{Number(item.sales_quantity).toLocaleString("id-ID")} {item.sales_unit==="CARTON"?"dus":"pcs"}</td><td>{money(item.unit_price)}</td><td>{money(item.line_total)}</td></tr>)}</tbody></table></div>
   <section className="receipt-totals"><div><span>Subtotal</span><strong>{money(doc.subtotal_amount)}</strong></div><div><span>Diskon</span><strong>− {money(doc.discount_amount)}</strong></div><div className="receipt-grand-total"><span>Total akhir</span><strong>{money(doc.grand_total)}</strong></div><div><span>Metode pembayaran</span><strong>{method}</strong></div><div><span>Status pembayaran</span><strong>{status}</strong></div><div><span>Uang diterima</span><strong>{money(doc.amount_received)}</strong></div><div><span>Kembalian</span><strong>{money(doc.change_amount)}</strong></div>{doc.payment_status!=="PAID"&&<div className="receipt-due"><span>Sisa tagihan</span><strong>{money(Number(doc.grand_total)-Number(doc.amount_received))}</strong></div>}</section>
   {doc.reference_number&&<p className="receipt-note">Referensi: {doc.reference_number}</p>}{doc.notes&&<p className="receipt-note">Catatan: {doc.notes}</p>}
   <footer className="receipt-footer"><strong>Terima kasih atas pembelian Anda.</strong><span>GUDANGKU · Sistem manajemen persediaan</span></footer>
  </article>
 </main>;
}
