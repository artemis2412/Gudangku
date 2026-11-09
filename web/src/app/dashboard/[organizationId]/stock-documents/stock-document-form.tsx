"use client";
import { useMemo,useState,type FormEvent } from "react";
import { useRouter } from "next/navigation";
type Warehouse={id:string;code:string;name:string};
type Product={id:string;name:string;sku:string|null;purchase_price:number|string;selling_price:number|string;pieces_per_carton:number|null;piece_selling_price:number|string|null;carton_selling_price:number|string|null};
type Customer={id:string;name:string;phone:string|null};
type Supplier={id:string;name:string;code:string|null};
type Line={product_id:string;quantity:string;unit_cost:string;sales_unit:"PCS"|"CARTON";sales_quantity:string;unit_price:string};
const money=(v:number)=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(v);
export function StockDocumentForm({organizationId,warehouses,products,customers,suppliers}:{organizationId:string;warehouses:Warehouse[];products:Product[];customers:Customer[];suppliers:Supplier[]}) {
 const router=useRouter();const [type,setType]=useState<"IN"|"OUT"|"TRANSFER">("IN");const [source,setSource]=useState("");const [destination,setDestination]=useState("");
 const [notes,setNotes]=useState("");const [reference,setReference]=useState("");const [customerId,setCustomerId]=useState("");const [supplierId,setSupplierId]=useState("");const [discount,setDiscount]=useState("0");const [paymentMethod,setPaymentMethod]=useState<"CASH"|"BANK_TRANSFER"|"QRIS"|"CREDIT">("CASH");const [amountReceived,setAmountReceived]=useState("0");
 const [lines,setLines]=useState<Line[]>([{product_id:"",quantity:"1",unit_cost:"0",sales_unit:"PCS",sales_quantity:"1",unit_price:"0"}]);
 const [error,setError]=useState("");const [busy,setBusy]=useState(false);
 function updateLine(index:number,key:keyof Line,value:string){setLines(current=>current.map((line,i)=>i===index?{...line,[key]:value}:line));}
 function chooseProduct(index:number,id:string){const p=products.find(x=>x.id===id);setLines(current=>current.map((line,i)=>i!==index?line:{...line,product_id:id,unit_cost:String(p?.purchase_price??0),unit_price:String(line.sales_unit==="CARTON"?(p?.carton_selling_price??0):(p?.piece_selling_price??p?.selling_price??0))}));}
 function changeSalesUnit(index:number,unit:"PCS"|"CARTON"){const line=lines[index];const p=products.find(x=>x.id===line.product_id);const price=unit==="CARTON"?p?.carton_selling_price:p?.piece_selling_price??p?.selling_price;setLines(current=>current.map((x,i)=>i===index?{...x,sales_unit:unit,unit_price:String(price??0)}:x));}
 function addLine(){if(lines.length<200)setLines(x=>[...x,{product_id:"",quantity:"1",unit_cost:"0",sales_unit:"PCS",sales_quantity:"1",unit_price:"0"}]);}
 function removeLine(index:number){setLines(x=>x.length>1?x.filter((_,i)=>i!==index):x);}
 const subtotal=useMemo(()=>type==="OUT"?lines.reduce((sum,line)=>sum+Number(line.sales_quantity||0)*Number(line.unit_price||0),0):type==="IN"?lines.reduce((sum,line)=>sum+Number(line.quantity||0)*Number(line.unit_cost||0),0):0,[type,lines]);const discountValue=Math.max(0,Number(discount||0));const grandTotal=Math.max(0,subtotal-discountValue);const receivedValue=Math.max(0,Number(amountReceived||0));const changeValue=paymentMethod==="CASH"?Math.max(0,receivedValue-grandTotal):0;
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");
  try{const response=await fetch(`/api/organizations/${organizationId}/stock-documents`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
   document_type:type,supplier_id:type==="IN"?supplierId||null:null,source_warehouse_id:type==="IN"?null:source,destination_warehouse_id:type==="OUT"?null:destination,customer_id:type==="OUT"?customerId||null:null,notes,reference_number:reference,discount_amount:type==="OUT"||type==="IN"?Number(discount):0,payment_method:type==="OUT"||type==="IN"?paymentMethod:"CASH",amount_received:type==="OUT"||type==="IN"?Number(amountReceived):0,
   items:lines.map(line=>type==="OUT"?{product_id:line.product_id,sales_unit:line.sales_unit,sales_quantity:Number(line.sales_quantity),unit_price:Number(line.unit_price),unit_cost:Number(line.unit_cost)}:{product_id:line.product_id,quantity:Number(line.quantity),unit_cost:Number(line.unit_cost)})
  })});const result=await response.json();if(!response.ok){setError(result.error||"Transaksi gagal dibuat.");return;}
  setLines([{product_id:"",quantity:"1",unit_cost:"0",sales_unit:"PCS",sales_quantity:"1",unit_price:"0"}]);setNotes("");setReference("");setCustomerId("");setSupplierId("");setDiscount("0");setAmountReceived("0");router.refresh();
  }catch{setError("Koneksi bermasalah. Coba lagi.");}finally{setBusy(false);}
 }
 return <form className="master-form transaction-form" onSubmit={submit}>
  <label htmlFor="doc-type">Jenis transaksi</label><select id="doc-type" value={type} onChange={e=>{setType(e.target.value as typeof type);setSource("");setDestination("");}}>
   <option value="IN">Barang masuk</option><option value="OUT">Barang keluar / penjualan</option><option value="TRANSFER">Transfer antar-gudang</option>
  </select>
  {type==="IN"&&<><label htmlFor="doc-supplier">Supplier (opsional)</label><select id="doc-supplier" value={supplierId} onChange={e=>setSupplierId(e.target.value)}><option value="">Pembelian tanpa supplier</option>{suppliers.map(s=><option key={s.id} value={s.id}>{s.name}{s.code?` · ${s.code}`:""}</option>)}</select></>}
  {type==="OUT"&&<><label htmlFor="doc-customer">Pelanggan (opsional)</label><select id="doc-customer" value={customerId} onChange={e=>setCustomerId(e.target.value)}><option value="">Pelanggan umum / tanpa nama</option>{customers.map(c=><option key={c.id} value={c.id}>{c.name}{c.phone?` · ${c.phone}`:""}</option>)}</select></>}
  {type!=="IN"&&<><label htmlFor="doc-source">{type==="TRANSFER"?"Gudang asal":"Gudang pengeluaran"}</label><select id="doc-source" value={source} onChange={e=>setSource(e.target.value)} required><option value="">Pilih gudang</option>{warehouses.map(w=><option key={w.id} value={w.id}>{w.code} · {w.name}</option>)}</select></>}
  {type!=="OUT"&&<><label htmlFor="doc-destination">{type==="TRANSFER"?"Gudang tujuan":"Gudang penerimaan"}</label><select id="doc-destination" value={destination} onChange={e=>setDestination(e.target.value)} required><option value="">Pilih gudang</option>{warehouses.filter(w=>type!=="TRANSFER"||w.id!==source).map(w=><option key={w.id} value={w.id}>{w.code} · {w.name}</option>)}</select></>}
  <div className="transaction-lines-heading"><strong>Item barang</strong><button type="button" className="add-line-button" onClick={addLine} disabled={lines.length>=200}>+ Tambah item</button></div>
  {lines.map((line,index)=>{const product=products.find(p=>p.id===line.product_id);const baseQty=type==="OUT"?Number(line.sales_quantity)*(line.sales_unit==="CARTON"?Number(product?.pieces_per_carton??0):1):Number(line.quantity);const subtotal=type==="OUT"?Number(line.sales_quantity)*Number(line.unit_price):0;
   return <div className="transaction-line" key={index}>
    <label htmlFor={`line-product-${index}`}>Produk {index+1}</label><select id={`line-product-${index}`} value={line.product_id} onChange={e=>chooseProduct(index,e.target.value)} required><option value="">Pilih produk</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}{p.sku?` · ${p.sku}`:""}</option>)}</select>
    {type==="OUT"?<>
     <div className="form-two-columns"><div><label htmlFor={`line-unit-${index}`}>Satuan jual</label><select id={`line-unit-${index}`} value={line.sales_unit} onChange={e=>changeSalesUnit(index,e.target.value as "PCS"|"CARTON")}><option value="PCS">Pcs</option><option value="CARTON" disabled={!product?.pieces_per_carton}>Dus</option></select></div><div><label htmlFor={`line-qty-${index}`}>Jumlah {line.sales_unit==="CARTON"?"dus":"pcs"}</label><input id={`line-qty-${index}`} type="number" min="0.001" step="0.001" value={line.sales_quantity} onChange={e=>updateLine(index,"sales_quantity",e.target.value)} required/></div></div>
     <label htmlFor={`line-price-${index}`}>Harga jual per {line.sales_unit==="CARTON"?"dus":"pcs"} (Rp)</label><input id={`line-price-${index}`} type="number" min="0" step="1" value={line.unit_price} onChange={e=>updateLine(index,"unit_price",e.target.value)} required/>
     <div className="sales-line-summary"><span>Keluar dari stok: <strong>{baseQty.toLocaleString("id-ID")} pcs/satuan dasar</strong></span><strong>{money(subtotal)}</strong></div>
    </>:<><div className="form-two-columns"><div><label htmlFor={`line-qty-${index}`}>Jumlah (satuan dasar)</label><input id={`line-qty-${index}`} type="number" min="0.001" step="0.001" value={line.quantity} onChange={e=>updateLine(index,"quantity",e.target.value)} required/></div><div><label htmlFor={`line-cost-${index}`}>Biaya modal/unit (Rp)</label><input id={`line-cost-${index}`} type="number" min="0" step="1" value={line.unit_cost} onChange={e=>updateLine(index,"unit_cost",e.target.value)} required/></div></div></>}
    {type==="OUT"&&<div className="form-two-columns"><div><label htmlFor={`line-cost-${index}`}>Biaya modal per pcs (Rp)</label><input id={`line-cost-${index}`} type="number" min="0" step="1" value={line.unit_cost} onChange={e=>updateLine(index,"unit_cost",e.target.value)} required/></div><div className="sales-cost-note"><span>Modal barang keluar</span><strong>{money(baseQty*Number(line.unit_cost||0))}</strong></div></div>}
    {lines.length>1&&<button type="button" className="remove-line-button" onClick={()=>removeLine(index)}>Hapus item</button>}
   </div>;
  })}
  {(type==="OUT"||type==="IN")&&<div className="sales-payment-panel">
   <div className="sales-payment-row"><span>{type==="IN"?"Total pembelian (biaya modal)":"Subtotal penjualan"}</span><strong>{money(subtotal)}</strong></div>
   <label htmlFor="sales-discount">{type==="IN"?"Potongan pembelian (Rp)":"Diskon (Rp)"}</label><input id="sales-discount" type="number" min="0" max={subtotal} step="1" value={discount} onChange={e=>setDiscount(e.target.value)} />
   <div className="sales-payment-row sales-grand-total"><span>{type==="IN"?"Total tagihan supplier":"Total akhir"}</span><strong>{money(grandTotal)}</strong></div>
   <label htmlFor="sales-payment-method">Metode pembayaran</label><select id="sales-payment-method" value={paymentMethod} onChange={e=>setPaymentMethod(e.target.value as typeof paymentMethod)}><option value="CASH">Tunai</option><option value="BANK_TRANSFER">Transfer bank</option><option value="QRIS">QRIS</option><option value="CREDIT">Belum lunas / tempo</option></select>
   <label htmlFor="sales-received">{type==="IN"?"Pembayaran ke supplier (Rp)":"Uang diterima (Rp)"}</label><input id="sales-received" type="number" min="0" step="1" value={amountReceived} onChange={e=>setAmountReceived(e.target.value)} />
   <div className="sales-payment-row"><span>{paymentMethod==="CASH"&&type==="OUT"?"Kembalian":paymentMethod==="CASH"&&type==="IN"?"Kembalian":"Sisa tagihan"}</span><strong>{paymentMethod==="CASH"?money(changeValue):money(Math.max(0,grandTotal-receivedValue))}</strong></div>
   <p className="field-hint">{type==="IN"?"Status utang supplier":"Status pembayaran"}: {receivedValue===0?"Belum dibayar":receivedValue>=grandTotal?"Lunas":"Dibayar sebagian"}. Nilai final dihitung ulang oleh server.</p>
  </div>}
  <label htmlFor="doc-reference">Nomor referensi / nota (opsional)</label><input id="doc-reference" value={reference} onChange={e=>setReference(e.target.value)} maxLength={100}/>
  <label htmlFor="doc-notes">Catatan (opsional)</label><textarea id="doc-notes" rows={2} value={notes} onChange={e=>setNotes(e.target.value)} maxLength={1000}/>
  <p className="field-hint">Dokumen disimpan sebagai draft. Stok baru berkurang setelah manager memposting transaksi. Harga dan subtotal tersimpan pada dokumen sebagai riwayat.</p>
  {error&&<p className="form-error">{error}</p>}<button className="primary-button auth-submit" disabled={busy||!warehouses.length||!products.length}>{busy?"Menyimpan...":"Simpan draft transaksi"}</button>
  {(!warehouses.length||!products.length)&&<p className="field-hint">Tambahkan minimal satu gudang aktif dan satu produk aktif terlebih dahulu.</p>}
 </form>;
}
