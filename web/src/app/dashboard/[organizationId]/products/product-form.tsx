"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Option = { id: string; name: string; abbreviation?: string | null };
export function ProductForm({ organizationId, categories, units }: { organizationId: string; categories: Option[]; units: Option[] }) {
  const router = useRouter();
  const [values, setValues] = useState({ name: "", sku: "", barcode: "", description: "", category_id: "", unit_id: "", minimum_stock: "0", purchase_price: "0", selling_price: "0" });
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  function change(field: keyof typeof values, value: string) { setValues(current => ({ ...current, [field]: value })); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`/api/organizations/${organizationId}/products`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Produk gagal disimpan."); return; }
      setValues({ name: "", sku: "", barcode: "", description: "", category_id: "", unit_id: "", minimum_stock: "0", purchase_price: "0", selling_price: "0" }); router.refresh();
    } catch { setError("Koneksi bermasalah. Coba lagi."); }
    finally { setBusy(false); }
  }
  return <form className="master-form" onSubmit={submit}>
    <label htmlFor="product-name">Nama produk</label><input id="product-name" value={values.name} onChange={e => change("name", e.target.value)} maxLength={150} required/>
    <div className="form-two-columns"><div><label htmlFor="product-sku">SKU</label><input id="product-sku" value={values.sku} onChange={e => change("sku", e.target.value)} maxLength={60} placeholder="Kode barang"/></div><div><label htmlFor="product-barcode">Barcode</label><input id="product-barcode" value={values.barcode} onChange={e => change("barcode", e.target.value)} maxLength={80}/></div></div>
    <div className="form-two-columns"><div><label htmlFor="product-category">Kategori</label><select id="product-category" value={values.category_id} onChange={e => change("category_id", e.target.value)}><option value="">Tanpa kategori</option>{categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div><label htmlFor="product-unit">Satuan</label><select id="product-unit" value={values.unit_id} onChange={e => change("unit_id", e.target.value)}><option value="">Tanpa satuan</option>{units.map(item => <option key={item.id} value={item.id}>{item.name}{item.abbreviation ? ` (${item.abbreviation})` : ""}</option>)}</select></div></div>
    <label htmlFor="product-description">Deskripsi</label><textarea id="product-description" rows={2} value={values.description} onChange={e => change("description", e.target.value)} maxLength={1000}/>
    <div className="form-two-columns"><div><label htmlFor="product-minimum">Stok minimum</label><input id="product-minimum" type="number" min="0" step="0.01" value={values.minimum_stock} onChange={e => change("minimum_stock", e.target.value)}/></div><div><label htmlFor="product-buy">Harga beli (Rp)</label><input id="product-buy" type="number" min="0" step="1" value={values.purchase_price} onChange={e => change("purchase_price", e.target.value)}/></div></div>
    <label htmlFor="product-sell">Harga jual (Rp)</label><input id="product-sell" type="number" min="0" step="1" value={values.selling_price} onChange={e => change("selling_price", e.target.value)}/>
    {error && <p className="form-error">{error}</p>}<button className="primary-button auth-submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan produk"}</button>
  </form>;
}
