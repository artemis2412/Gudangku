"use client";
import { useMemo, useState } from "react";

type Product = { id: string; name: string; sku: string | null };
type Warehouse = { id: string; name: string; code: string };
type Movement = {
  id: string; movement_type: string; quantity_delta: number | string; unit_cost: number | string; occurred_at: string;
  products: Product | null; warehouses: Warehouse | null;
  stock_documents: { id: string; document_number: string; document_type: string; status: string } | null;\n  stock_counts: { id: string; count_number: string; status: string } | null;
};
const fmt = (v: number | string) => new Intl.NumberFormat("id-ID", { maximumFractionDigits: 3 }).format(Number(v ?? 0));
const dateFmt = (v: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v));
export function StockCardFilters({ movements, products, warehouses }: { movements: Array<Record<string, unknown>>; products: Product[]; warehouses: Warehouse[] }) {
  const [productId, setProductId] = useState(""); const [warehouseId, setWarehouseId] = useState(""); const [type, setType] = useState("");
  const rows = movements as unknown as Movement[];
  const filtered = useMemo(() => rows.filter(row =>
    (!productId || row.products?.id === productId) &&
    (!warehouseId || row.warehouses?.id === warehouseId) &&
    (!type || row.movement_type === type)
  ), [rows, productId, warehouseId, type]);
  return <>
    <div className="stock-card-filters">
      <div><label htmlFor="card-product">Produk</label><select id="card-product" value={productId} onChange={e => setProductId(e.target.value)}><option value="">Semua produk</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}{p.sku ? ` · ${p.sku}` : ""}</option>)}</select></div>
      <div><label htmlFor="card-warehouse">Gudang</label><select id="card-warehouse" value={warehouseId} onChange={e => setWarehouseId(e.target.value)}><option value="">Semua gudang</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.code} · {w.name}</option>)}</select></div>
      <div><label htmlFor="card-type">Jenis mutasi</label><select id="card-type" value={type} onChange={e => setType(e.target.value)}><option value="">Semua jenis</option><option value="IN">Masuk</option><option value="OUT">Keluar</option><option value="TRANSFER_IN">Transfer masuk</option><option value="TRANSFER_OUT">Transfer keluar</option><option value="ADJUSTMENT_IN">Penyesuaian masuk</option><option value="ADJUSTMENT_OUT">Penyesuaian keluar</option></select></div>
    </div>
    <div className="product-table-wrap"><table className="product-table stock-card-table"><thead><tr><th>Tanggal</th><th>Produk</th><th>Gudang</th><th>Dokumen</th><th>Mutasi</th><th>Saldo perubahan</th><th>Biaya/unit</th></tr></thead><tbody>
      {filtered.map(row => <tr key={row.id}><td>{dateFmt(row.occurred_at)}</td><td><strong>{row.products?.name ?? "Produk"}</strong></td><td>{row.warehouses?.name ?? "Gudang"}</td><td>{row.stock_documents?.document_number ?? row.stock_counts?.count_number ?? "—"}</td><td>{row.movement_type === "IN" ? "Masuk" : row.movement_type === "OUT" ? "Keluar" : row.movement_type === "TRANSFER_IN" ? "Transfer masuk" : row.movement_type === "TRANSFER_OUT" ? "Transfer keluar" : row.movement_type === "ADJUSTMENT_IN" ? "Penyesuaian masuk" : "Penyesuaian keluar"}</td><td><strong className={Number(row.quantity_delta) >= 0 ? "quantity-positive" : "quantity-negative"}>{Number(row.quantity_delta) > 0 ? "+" : ""}{fmt(row.quantity_delta)}</strong></td><td>Rp {fmt(row.unit_cost)}</td></tr>)}
    </tbody></table></div>
    {!filtered.length && <p className="empty-note">Tidak ada mutasi yang cocok dengan filter.</p>}
    <p className="field-hint">Menampilkan maksimal 1.000 mutasi terbaru. Mutasi transfer dicatat sebagai keluar dari gudang asal dan masuk ke gudang tujuan.</p>
  </>;
}
