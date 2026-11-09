"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type Warehouse = { id: string; code: string; name: string };
type Product = { id: string; name: string; sku: string | null; purchase_price: number | string };
type Line = { product_id: string; quantity: string; unit_cost: string };
export function StockDocumentForm({ organizationId, warehouses, products }: { organizationId: string; warehouses: Warehouse[]; products: Product[] }) {
  const router = useRouter();
  const [type, setType] = useState<"IN" | "OUT" | "TRANSFER">("IN");
  const [source, setSource] = useState(""); const [destination, setDestination] = useState("");
  const [notes, setNotes] = useState(""); const [reference, setReference] = useState("");
  const [lines, setLines] = useState<Line[]>([{ product_id: "", quantity: "1", unit_cost: "0" }]);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  function updateLine(index: number, key: keyof Line, value: string) { setLines(current => current.map((line, i) => i === index ? { ...line, [key]: value } : line)); }
  function addLine() { if (lines.length < 200) setLines(current => [...current, { product_id: "", quantity: "1", unit_cost: "0" }]); }
  function removeLine(index: number) { setLines(current => current.length > 1 ? current.filter((_, i) => i !== index) : current); }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`/api/organizations/${organizationId}/stock-documents`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        document_type: type, source_warehouse_id: type === "IN" ? null : source,
        destination_warehouse_id: type === "OUT" ? null : destination, notes, reference_number: reference,
        items: lines.map(line => ({ product_id: line.product_id, quantity: Number(line.quantity), unit_cost: Number(line.unit_cost) })),
      }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Transaksi gagal dibuat."); return; }
      setLines([{ product_id: "", quantity: "1", unit_cost: "0" }]); setNotes(""); setReference(""); router.refresh();
    } catch { setError("Koneksi bermasalah. Coba lagi."); }
    finally { setBusy(false); }
  }
  return <form className="master-form transaction-form" onSubmit={submit}>
    <label htmlFor="doc-type">Jenis transaksi</label><select id="doc-type" value={type} onChange={e => { setType(e.target.value as typeof type); setSource(""); setDestination(""); }}>
      <option value="IN">Barang masuk</option><option value="OUT">Barang keluar</option><option value="TRANSFER">Transfer antar-gudang</option>
    </select>
    {type !== "IN" && <><label htmlFor="doc-source">{type === "TRANSFER" ? "Gudang asal" : "Gudang pengeluaran"}</label><select id="doc-source" value={source} onChange={e => setSource(e.target.value)} required><option value="">Pilih gudang</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.code} · {w.name}</option>)}</select></>}
    {type !== "OUT" && <><label htmlFor="doc-destination">{type === "TRANSFER" ? "Gudang tujuan" : "Gudang penerimaan"}</label><select id="doc-destination" value={destination} onChange={e => setDestination(e.target.value)} required><option value="">Pilih gudang</option>{warehouses.filter(w => type !== "TRANSFER" || w.id !== source).map(w => <option key={w.id} value={w.id}>{w.code} · {w.name}</option>)}</select></>}
    <div className="transaction-lines-heading"><strong>Item barang</strong><button type="button" className="add-line-button" onClick={addLine} disabled={lines.length >= 200}>+ Tambah item</button></div>
    {lines.map((line, index) => <div className="transaction-line" key={index}>
      <label htmlFor={`line-product-${index}`}>Produk {index + 1}</label><select id={`line-product-${index}`} value={line.product_id} onChange={e => { const p = products.find(item => item.id === e.target.value); updateLine(index, "product_id", e.target.value); if (p) updateLine(index, "unit_cost", String(p.purchase_price ?? 0)); }} required><option value="">Pilih produk</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` · ${p.sku}` : ""}</option>)}</select>
      <div className="form-two-columns"><div><label htmlFor={`line-qty-${index}`}>Jumlah</label><input id={`line-qty-${index}`} type="number" min="0.001" step="0.001" value={line.quantity} onChange={e => updateLine(index, "quantity", e.target.value)} required/></div><div><label htmlFor={`line-cost-${index}`}>Biaya/unit (Rp)</label><input id={`line-cost-${index}`} type="number" min="0" step="1" value={line.unit_cost} onChange={e => updateLine(index, "unit_cost", e.target.value)} required/></div></div>
      {lines.length > 1 && <button type="button" className="remove-line-button" onClick={() => removeLine(index)}>Hapus item</button>}
    </div>)}
    <label htmlFor="doc-reference">Nomor referensi (opsional)</label><input id="doc-reference" value={reference} onChange={e => setReference(e.target.value)} maxLength={100}/>
    <label htmlFor="doc-notes">Catatan (opsional)</label><textarea id="doc-notes" rows={2} value={notes} onChange={e => setNotes(e.target.value)} maxLength={1000}/>
    <p className="field-hint">Dokumen akan disimpan sebagai draft. Stok belum berubah sampai manager melakukan posting.</p>
    {error && <p className="form-error">{error}</p>}<button className="primary-button auth-submit" disabled={busy || !warehouses.length || !products.length}>{busy ? "Menyimpan..." : "Simpan draft transaksi"}</button>
    {(!warehouses.length || !products.length) && <p className="field-hint">Tambahkan minimal satu gudang aktif dan satu produk aktif terlebih dahulu.</p>}
  </form>;
}
