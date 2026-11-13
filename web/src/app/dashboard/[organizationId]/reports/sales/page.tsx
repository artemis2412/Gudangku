import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatWarehouseDate } from "@/lib/timezone";

type SearchParams = { from?: string; to?: string; customer?: string };
type SalesRow = {
  id: string;
  document_number: string;
  occurred_at: string;
  customer_id: string | null;
  subtotal_amount: number | string;
  discount_amount: number | string;
  grand_total: number | string;
  amount_received: number | string;
  payment_status: string;
  payment_method: string;
  customers: { name: string } | null;
  warehouses:{time_zone:string}|null;
};

const amount = (value: number | string | null | undefined) => Number(value ?? 0);
const rupiah = (value: number) => new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", maximumFractionDigits: 0,
}).format(value);
const dateLabel = (value: string) => new Intl.DateTimeFormat("id-ID", {
  dateStyle: "medium", timeStyle: "short",
}).format(new Date(value));
const validDate = (value?: string) => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

export default async function SalesReportPage({
  params, searchParams,
}: {
  params: Promise<{ organizationId: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { organizationId } = await params;
  const filters = await searchParams;
  const from = validDate(filters.from) ? filters.from! : "";
  const to = validDate(filters.to) ? filters.to! : "";
  const customerId = filters.customer ?? "";
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: membership } = await supabase.from("organization_members")
    .select("organizations(name)").eq("organization_id", organizationId)
    .eq("user_id", userId).maybeSingle();
  if (!membership?.organizations) notFound();
  const organization = membership.organizations as unknown as { name: string };

  let query = supabase.from("stock_documents")
    .select("id, document_number, occurred_at, customer_id, subtotal_amount, discount_amount, grand_total, amount_received, payment_status, payment_method, customers(name), warehouses:warehouses!stock_documents_organization_id_source_warehouse_id_fkey(time_zone)")
    .eq("organization_id", organizationId).eq("document_type", "OUT").eq("status", "POSTED")
    .order("occurred_at", { ascending: false }).limit(1000);
  if (from) query = query.gte("occurred_at", `${from}T00:00:00`);
  if (to) {
    const end = new Date(`${to}T00:00:00`);
    end.setDate(end.getDate() + 1);
    query = query.lt("occurred_at", end.toISOString());
  }
  if (customerId) query = query.eq("customer_id", customerId);

  const [salesResult, customersResult] = await Promise.all([
    query,
    supabase.from("customers").select("id, name").eq("organization_id", organizationId)
      .eq("is_active", true).order("name").limit(500),
  ]);
  const sales = (salesResult.data ?? []) as unknown as SalesRow[];
  const gross = sales.reduce((sum, row) => sum + amount(row.subtotal_amount), 0);
  const discounts = sales.reduce((sum, row) => sum + amount(row.discount_amount), 0);
  const net = sales.reduce((sum, row) => sum + amount(row.grand_total), 0);
  const collected = sales.reduce((sum, row) => sum + Math.min(amount(row.grand_total), amount(row.amount_received)), 0);
  const outstanding = sales.reduce((sum, row) => sum + Math.max(0, amount(row.grand_total) - amount(row.amount_received)), 0);
  const unpaidCount = sales.filter(row => row.payment_status !== "PAID").length;

  return <main className="dashboard-shell">
    <header className="dashboard-topbar">
      <Link href="/" className="brand"><span className="brand-mark">G</span><span>GUDANGKU</span></Link>
      <Link href={`/dashboard/${organizationId}`} className="text-button">Kembali ke dashboard</Link>
    </header>
    <section className="dashboard-heading">
      <p className="eyebrow">LAPORAN · PENJUALAN</p>
      <h1>Laporan penjualan</h1>
      <p className="auth-description">Ringkasan transaksi barang keluar yang sudah diposting untuk {organization.name}. Draft tidak dihitung.</p>
    </section>

    <section className="data-panel report-filter-panel">
      <form method="get" className="report-filters">
        <div><label htmlFor="from">Dari tanggal</label><input id="from" name="from" type="date" defaultValue={from}/></div>
        <div><label htmlFor="to">Sampai tanggal</label><input id="to" name="to" type="date" defaultValue={to}/></div>
        <div><label htmlFor="customer">Pelanggan</label><select id="customer" name="customer" defaultValue={customerId}><option value="">Semua pelanggan</option>{(customersResult.data ?? []).map(customer => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></div>
        <button className="primary-button report-filter-submit" type="submit">Terapkan filter</button>
        <Link className="text-button report-reset" href={`/dashboard/${organizationId}/reports/sales`}>Reset</Link>
      </form>
      {salesResult.error && <p className="form-error">Data laporan gagal dimuat. Periksa relasi pelanggan dan izin database.</p>}
      {customersResult.error && <p className="form-error">Daftar pelanggan untuk filter gagal dimuat.</p>}
    </section>

    <section className="report-metric-grid">
      <article className="metric-card"><span>TRANSAKSI</span><strong>{sales.length}</strong><small>Penjualan terposting</small></article>
      <article className="metric-card"><span>PENJUALAN BERSIH</span><strong>{rupiah(net)}</strong><small>Setelah diskon</small></article>
      <article className="metric-card"><span>PEMBAYARAN DITERIMA</span><strong>{rupiah(collected)}</strong><small>Nilai yang sudah dialokasikan</small></article>
      <article className="metric-card metric-alert"><span>SISA PIUTANG</span><strong>{rupiah(outstanding)}</strong><small>{unpaidCount} transaksi belum lunas</small></article>
    </section>

    <section className="data-panel sales-report-table-panel">
      <div className="panel-section-heading">
        <div><p className="eyebrow">RINCIAN</p><h2>Daftar penjualan</h2></div>
        <span className="panel-count">{sales.length} transaksi</span>
      </div>
      <div className="report-summary-line"><span>Subtotal kotor: <strong>{rupiah(gross)}</strong></span><span>Total diskon: <strong>{rupiah(discounts)}</strong></span></div>
      {sales.length ? <div className="product-table-wrap"><table className="product-table sales-report-table">
        <thead><tr><th>Tanggal</th><th>No. transaksi</th><th>Pelanggan</th><th>Subtotal</th><th>Diskon</th><th>Total</th><th>Dibayar</th><th>Sisa</th><th>Status</th><th></th></tr></thead>
        <tbody>{sales.map(row => {
          const paid = Math.min(amount(row.grand_total), amount(row.amount_received));
          const due = Math.max(0, amount(row.grand_total) - amount(row.amount_received));
          return <tr key={row.id}>
            <td>{formatWarehouseDate(row.occurred_at,row.warehouses?.time_zone??"Asia/Jakarta")}</td>
            <td><strong>{row.document_number}</strong></td>
            <td>{row.customers?.name ?? "Umum"}</td>
            <td>{rupiah(amount(row.subtotal_amount))}</td>
            <td>{rupiah(amount(row.discount_amount))}</td>
            <td><strong>{rupiah(amount(row.grand_total))}</strong></td>
            <td>{rupiah(paid)}</td>
            <td>{rupiah(due)}</td>
            <td><span className={row.payment_status === "PAID" ? "status-active" : "status-pending"}>{row.payment_status === "PAID" ? "Lunas" : row.payment_status === "PARTIAL" ? "Sebagian" : "Belum bayar"}</span></td>
            <td><Link className="text-button" href={`/dashboard/${organizationId}/stock-documents/${row.id}/receipt`}>Nota</Link></td>
          </tr>;
        })}</tbody>
      </table></div> : <p className="empty-note">Tidak ada penjualan terposting pada filter ini.</p>}
      {sales.length === 1000 && <p className="field-hint">Menampilkan maksimal 1.000 transaksi terbaru. Persempit rentang tanggal untuk laporan yang lebih lengkap.</p>}
    </section>
  </main>;
}
