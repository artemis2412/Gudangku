"use client";
import { useMemo,useState,type FormEvent } from "react";
import { useRouter } from "next/navigation";
type Warehouse={id:string;name:string;code:string}; type Product={id:string;name:string;sku:string|null}; type Balance={warehouse_id:string;product_id:string;quantity:number|string};
export function StockCountForm({organizationId,warehouses,products,balances}:{organizationId:string;warehouses:Warehouse[];products:Product[];balances:Balance[]}) {
 const router=useRouter(); const [warehouseId,setWarehouseId]=useState(warehouses[0]?.id??""); const [quantities,setQuantities]=useState<Record<string,string>>({}); const [notes,setNotes]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
 const systemMap=useMemo(()=>new Map(balances.filter(b=>b.warehouse_id===warehouseId).map(b=>[b.product_id,Number(b.quantity)])),[balances,warehouseId]);
 function qty(id:string){return quantities[id]??String(systemMap.get(id)??0);}
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");
  try{const response=await fetch(`/api/organizations/${organizationId}/stock-counts`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({warehouse_id:warehouseId,notes,items:products.map(p=>({product_id:p.id,counted_quantity:Number(qty(p.id))}))})});
   const result=await response.json();if(!response.ok){setError(result.error??"Opname gagal dibuat.");return;}setQuantities({});setNotes("");router.refresh();
  }catch{setError("Koneksi bermasalah. Coba lagi.");}finally{setBusy(false);}
 }
 return <form className="master-form stock-count-form" onSubmit={submit}>
  <label htmlFor="count-warehouse">Gudang</label><select id="count-warehouse" value={warehouseId} onChange={e=>{setWarehouseId(e.target.value);setQuantities({});}} required>{warehouses.map(w=><option key={w.id} value={w.id}>{w.code} · {w.name}</option>)}</select>
  <p className="field-hint">Jumlah sistem diambil saat dokumen dibuat. Isi jumlah fisik hasil hitung. Semua produk aktif dalam daftar akan ikut opname.</p>
  <div className="count-entry-list">{products.map(p=><div className="count-entry" key={p.id}><div><strong>{p.name}</strong><small>{p.sku||"Tanpa SKU"} · Sistem: {new Intl.NumberFormat("id-ID",{maximumFractionDigits:3}).format(systemMap.get(p.id)??0)}</small></div><label><span>Fisik</span><input aria-label={`Jumlah fisik ${p.name}`} type="number" min="0" step="0.001" value={qty(p.id)} onChange={e=>setQuantities(prev=>({...prev,[p.id]:e.target.value}))} required/></label></div>)}</div>
  <label htmlFor="count-notes">Catatan (opsional)</label><textarea id="count-notes" value={notes} onChange={e=>setNotes(e.target.value)} maxLength={1000} rows={2}/>
  {error&&<p className="form-error">{error}</p>}<button className="primary-button auth-submit" disabled={busy||!warehouseId||products.length===0}>{busy?"Menyimpan...":"Simpan draft opname"}</button>
 </form>;
}
