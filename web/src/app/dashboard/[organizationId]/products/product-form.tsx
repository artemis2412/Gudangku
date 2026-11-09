"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
type Option = { id: string; name: string; abbreviation?: string | null };
const initial = { name:"",sku:"",barcode:"",description:"",category_id:"",unit_id:"",minimum_stock:"0",purchase_price:"0",selling_price:"0",pieces_per_carton:"",piece_selling_price:"",carton_selling_price:"" };
export function ProductForm({ organizationId,categories,units }:{organizationId:string;categories:Option[];units:Option[]}) {
 const router=useRouter();const [values,setValues]=useState(initial);const [error,setError]=useState("");const [busy,setBusy]=useState(false);
 function change(field:keyof typeof values,value:string){setValues(current=>({...current,[field]:value}));}
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError("");
  try{const response=await fetch(`/api/organizations/${organizationId}/products`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(values)});const result=await response.json();if(!response.ok){setError(result.error||"Produk gagal disimpan.");return;}setValues(initial);router.refresh();}
  catch{setError("Koneksi bermasalah. Coba lagi.");}finally{setBusy(false);}
 }
 return <form className="master-form" onSubmit={submit}>
  <label htmlFor="product-name">Nama produk</label><input id="product-name" value={values.name} onChange={e=>change("name",e.target.value)} maxLength={150} required/>
  <div className="form-two-columns"><div><label htmlFor="product-sku">SKU</label><input id="product-sku" value={values.sku} onChange={e=>change("sku",e.target.value)} maxLength={60} placeholder="Kode barang"/></div><div><label htmlFor="product-barcode">Barcode</label><input id="product-barcode" value={values.barcode} onChange={e=>change("barcode",e.target.value)} maxLength={80}/></div></div>
  <div className="form-two-columns"><div><label htmlFor="product-category">Kategori</label><select id="product-category" value={values.category_id} onChange={e=>change("category_id",e.target.value)}><option value="">Tanpa kategori</option>{categories.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></div><div><label htmlFor="product-unit">Satuan dasar stok</label><select id="product-unit" value={values.unit_id} onChange={e=>change("unit_id",e.target.value)}><option value="">Tanpa satuan</option>{units.map(x=><option key={x.id} value={x.id}>{x.name}{x.abbreviation? ` (${x.abbreviation})`:""}</option>)}</select></div></div>
  <label htmlFor="product-description">Deskripsi</label><textarea id="product-description" rows={2} value={values.description} onChange={e=>change("description",e.target.value)} maxLength={1000}/>
  <div className="form-two-columns"><div><label htmlFor="product-minimum">Stok minimum (satuan dasar)</label><input id="product-minimum" type="number" min="0" step="0.001" value={values.minimum_stock} onChange={e=>change("minimum_stock",e.target.value)}/></div><div><label htmlFor="product-buy">Harga beli per satuan dasar (Rp)</label><input id="product-buy" type="number" min="0" step="1" value={values.purchase_price} onChange={e=>change("purchase_price",e.target.value)}/></div></div>
  <div className="form-divider-label">PENGATURAN KEMASAN & HARGA JUAL</div>
  <label htmlFor="product-carton-qty">Isi satu dus (pcs) · opsional</label><input id="product-carton-qty" type="number" min="1" step="1" value={values.pieces_per_carton} onChange={e=>change("pieces_per_carton",e.target.value)} placeholder="Contoh: 24"/>
  <div className="form-two-columns"><div><label htmlFor="product-piece-price">Harga jual per pcs (Rp) · opsional</label><input id="product-piece-price" type="number" min="0" step="1" value={values.piece_selling_price} onChange={e=>change("piece_selling_price",e.target.value)} placeholder={`Default: ${values.selling_price}`}/></div><div><label htmlFor="product-carton-price">Harga jual per dus (Rp) · opsional</label><input id="product-carton-price" type="number" min="0" step="1" value={values.carton_selling_price} onChange={e=>change("carton_selling_price",e.target.value)} placeholder="Harga satu dus"/></div></div>
  <p className="field-hint">Harga jual lama tetap dipakai sebagai harga default per satuan dasar jika harga pcs tidak diisi. Harga dus dapat dibuat lebih murah dari total harga pcs.</p>
  {error&&<p className="form-error">{error}</p>}<button className="primary-button auth-submit" disabled={busy}>{busy?"Menyimpan...":"Simpan produk"}</button>
 </form>;
}
