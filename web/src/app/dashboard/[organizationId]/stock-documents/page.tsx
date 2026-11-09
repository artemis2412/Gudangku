import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StockDocumentForm } from "./stock-document-form";

type Warehouse = { id: string; code: string; name: string };
type Product = { id: string; name: string; sku: string | null; purchase_price: number | string };
type Document = { id: string; document_number: string; document_type: string; status: string; occurred_at: string; notes: string | null; stock_document_items: { id: string; quantity: number | string; products: { name: string } | null }[] };
const dateFmt = (v: string) => new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(v));

export default async function StockDocumentsPage({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");
  const { data: membership } = await supabase.from("organization_members").select("role, organizations(name)")
    .eq("organization_id", organizationId).eq("user_id", userId).maybeSingle();
  if (!membership?.organizations) notFound();
  const organization = membership.organizations as unknown as { name: string };
  const [warehousesResult, productsResult, documentsResult] = await Promise.all([
    supabase.from("warehouses").select("id, code, name").eq("organization_id", organizationId).eq("is_active", true).order("name"),
    supabase.from("products").select("id, name, sku, purchase_price").eq("organization_id", organizationId).eq("is_active", true).order("name").limit(500),
    supabase.from("stock_documents").select("id, document_number, document_type, status, occurred_at, notes, stock_document_items(id, quantity, products(name))")
      .eq("organization_id", organizationId).order("created_at", { ascending: false }).limit(100),
  ]);
  const canPost = ["owner", "admin", "manager"].includes(membership.role);
  return <main className="dashboard-shell">
    <header className="dashboard-topbar"><Link href="/" className="brand"><span className="brand-mark">G</span><span>GUDANGKU</span></Link><Link href={`/dashboard/${organizationId}`} className="text-button">Kembali ke dashboard</Link></header>
    <section className="dashboard-heading"><p className="eyebrow">PERSEDIAAN · TRANSAKSI</p><h1>Transaksi stok</h1><p className="auth-description">Barang masuk, barang keluar, dan transfer antar-gudang untuk {organization.name}.</p></section>
    <section className="master-layout">
      <article className="data-panel"><div className="panel-section-heading"><div><p className="eyebrow">DOKUMEN</p><h2>Riwayat transaksi</h2></div><span className="panel-count">{documentsResult.data?.length ?? 0} dokumen</span></div>
        {documentsResult.error && <p className="form-error">Riwayat transaksi gagal dimuat.</p>}
        {documentsResult.data?.length ? <div className="document-list">{(documentsResult.data as unknown as Document[]).map(doc => <div className="document-row" key={doc.id}><div className="document-main"><div className="document-title"><strong>{doc.document_number}</strong><span className={doc.status === "POSTED" ? "status-active" : "status-pending"}>{doc.status === "POSTED" ? "Tersimpan" : doc.status === "DRAFT" ? "Draft" : doc.status}</span></div><small>{doc.document_type === "IN" ? "Barang masuk" : doc.document_type === "OUT" ? "Barang keluar" : "Transfer gudang"} · {dateFmt(doc.occurred_at)}</small><small>{doc.stock_document_items.length} item · {doc.stock_document_items.slice(0, 3).map(item => item.products?.name ?? "Produk").join(", ")}</small></div>{doc.status === "DRAFT" && canPost && <form action={`/api/organizations/${organizationId}/stock-documents/${doc.id}/post`} method="post"><button className="post-document-button" formAction={undefined} type="button" data-document-id={doc.id}>Posting</button></form>}</div>)}</div> : <p className="empty-note">Belum ada transaksi. Buat transaksi pertama melalui formulir.</p>}
      </article>
      <article className="data-panel"><p className="eyebrow">BUAT DOKUMEN</p><h2 className="form-panel-title">Transaksi baru</h2>
        {warehousesResult.error || productsResult.error ? <p className="form-error">Data gudang atau produk gagal dimuat.</p> : <StockDocumentForm organizationId={organizationId} warehouses={(warehousesResult.data ?? []) as Warehouse[]} products={(productsResult.data ?? []) as Product[]}/>}
      </article>
    </section>
  </main>;
}
