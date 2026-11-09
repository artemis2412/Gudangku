import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ItemInput = { product_id?: unknown; quantity?: unknown; unit_cost?: unknown; notes?: unknown };
export async function POST(request: NextRequest, { params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  const { data: member } = await supabase.from("organization_members").select("role")
    .eq("organization_id", organizationId).eq("user_id", userId).maybeSingle();
  if (!member || !["owner", "admin", "manager", "staff"].includes(member.role))
    return NextResponse.json({ error: "Tidak memiliki akses membuat transaksi." }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 }); }
  const input = body as { document_type?: unknown; source_warehouse_id?: unknown; destination_warehouse_id?: unknown; notes?: unknown; reference_number?: unknown; occurred_at?: unknown; items?: unknown };
  const type = input.document_type;
  if (type !== "IN" && type !== "OUT" && type !== "TRANSFER")
    return NextResponse.json({ error: "Jenis transaksi tidak valid." }, { status: 400 });
  const source = typeof input.source_warehouse_id === "string" ? input.source_warehouse_id : null;
  const destination = typeof input.destination_warehouse_id === "string" ? input.destination_warehouse_id : null;
  if ((type === "IN" && !destination) || (type === "OUT" && !source) || (type === "TRANSFER" && (!source || !destination || source === destination)))
    return NextResponse.json({ error: "Gudang asal/tujuan belum benar." }, { status: 400 });
  const rawItems = Array.isArray(input.items) ? input.items as ItemInput[] : [];
  if (rawItems.length < 1 || rawItems.length > 200) return NextResponse.json({ error: "Transaksi harus memiliki 1–200 item." }, { status: 400 });
  const items = rawItems.map(item => ({
    product_id: typeof item.product_id === "string" ? item.product_id : "",
    quantity: Number(item.quantity),
    unit_cost: Number(item.unit_cost ?? 0),
    notes: typeof item.notes === "string" ? item.notes.trim().slice(0, 250) : null,
  }));
  if (items.some(item => !item.product_id || !Number.isFinite(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unit_cost) || item.unit_cost < 0))
    return NextResponse.json({ error: "Produk, jumlah, dan biaya per unit harus valid." }, { status: 400 });
  if (new Set(items.map(item => item.product_id)).size !== items.length)
    return NextResponse.json({ error: "Produk yang sama tidak boleh dimasukkan dua kali dalam satu transaksi." }, { status: 400 });

  const warehouseIds = [source, destination].filter((id): id is string => Boolean(id));
  const { data: warehouses } = await supabase.from("warehouses").select("id")
    .eq("organization_id", organizationId).in("id", warehouseIds).eq("is_active", true);
  if ((warehouses?.length ?? 0) !== new Set(warehouseIds).size)
    return NextResponse.json({ error: "Gudang tidak valid atau tidak aktif." }, { status: 400 });
  const productIds = items.map(item => item.product_id);
  const { data: products } = await supabase.from("products").select("id")
    .eq("organization_id", organizationId).in("id", productIds).eq("is_active", true);
  if ((products?.length ?? 0) !== productIds.length)
    return NextResponse.json({ error: "Ada produk tidak valid atau nonaktif." }, { status: 400 });

  const now = new Date();
  const occurredAt = typeof input.occurred_at === "string" && !Number.isNaN(Date.parse(input.occurred_at)) ? new Date(input.occurred_at).toISOString() : now.toISOString();
  const documentNumber = `GDG-${type}-${now.toISOString().replace(/[-:TZ.]/g, "").slice(0, 14)}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  const { data: document, error: documentError } = await supabase.from("stock_documents").insert({
    organization_id: organizationId, document_number: documentNumber, document_type: type, status: "DRAFT",
    source_warehouse_id: source, destination_warehouse_id: destination,
    notes: typeof input.notes === "string" ? input.notes.trim().slice(0, 1000) || null : null,
    reference_number: typeof input.reference_number === "string" ? input.reference_number.trim().slice(0, 100) || null : null,
    occurred_at: occurredAt, created_by: userId,
  }).select("id, document_number").single();
  if (documentError || !document) return NextResponse.json({ error: "Dokumen transaksi gagal dibuat." }, { status: 400 });

  const { error: itemError } = await supabase.from("stock_document_items").insert(items.map(item => ({ ...item, organization_id: organizationId, document_id: document.id })));
  if (itemError) {
    await supabase.from("stock_documents").delete().eq("id", document.id).eq("organization_id", organizationId);
    return NextResponse.json({ error: "Item transaksi gagal disimpan. Draft dibatalkan; periksa kembali data produk." }, { status: 400 });
  }
  return NextResponse.json({ document }, { status: 201 });
}
