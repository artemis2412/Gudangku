import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

type InputItem = { product_id?: unknown; counted_quantity?: unknown; notes?: unknown };
export async function POST(request: NextRequest, { params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  const { data: member } = await supabase.from("organization_members").select("role").eq("organization_id", organizationId).eq("user_id", userId).maybeSingle();
  if (!member || !["owner", "admin", "manager", "staff"].includes(member.role)) return NextResponse.json({ error: "Tidak memiliki akses membuat stock opname." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 }); }
  const input = body as { warehouse_id?: unknown; notes?: unknown; items?: unknown };
  const warehouseId = typeof input.warehouse_id === "string" ? input.warehouse_id : "";
  if (!warehouseId) return NextResponse.json({ error: "Pilih gudang terlebih dahulu." }, { status: 400 });
  const { data: warehouse } = await supabase.from("warehouses").select("id").eq("organization_id", organizationId).eq("id", warehouseId).eq("is_active", true).maybeSingle();
  if (!warehouse) return NextResponse.json({ error: "Gudang tidak valid atau tidak aktif." }, { status: 400 });
  const rawItems = Array.isArray(input.items) ? input.items as InputItem[] : [];
  if (rawItems.length < 1 || rawItems.length > 500) return NextResponse.json({ error: "Opname harus berisi 1–500 produk." }, { status: 400 });
  const items = rawItems.map(item => ({ product_id: typeof item.product_id === "string" ? item.product_id : "", counted_quantity: Number(item.counted_quantity), notes: typeof item.notes === "string" ? item.notes.trim().slice(0,250) || null : null }));
  if (items.some(item => !item.product_id || !Number.isFinite(item.counted_quantity) || item.counted_quantity < 0) || new Set(items.map(x=>x.product_id)).size !== items.length)
    return NextResponse.json({ error: "Daftar produk atau jumlah fisik tidak valid." }, { status: 400 });
  const ids = items.map(x=>x.product_id);
  const [{ data: products }, { data: balances }] = await Promise.all([
    supabase.from("products").select("id").eq("organization_id", organizationId).eq("is_active", true).in("id", ids),
    supabase.from("stock_balances").select("product_id,quantity").eq("organization_id", organizationId).eq("warehouse_id", warehouseId).in("product_id", ids),
  ]);
  if ((products?.length ?? 0) !== ids.length) return NextResponse.json({ error: "Ada produk tidak valid atau nonaktif." }, { status: 400 });
  const quantityMap = new Map((balances ?? []).map(row=>[row.product_id, Number(row.quantity)]));
  const now = new Date();
  const countNumber = `OPN-${now.toISOString().replace(/[-:TZ.]/g,"").slice(0,14)}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
  const { data: count, error } = await supabase.from("stock_counts").insert({
    organization_id: organizationId, warehouse_id: warehouseId, count_number: countNumber,
    status: "DRAFT", notes: typeof input.notes === "string" ? input.notes.trim().slice(0,1000) || null : null,
    counted_at: now.toISOString(), created_by: userId,
  }).select("id,count_number").single();
  if (error || !count) return NextResponse.json({ error: "Dokumen opname gagal dibuat." }, { status: 400 });
  const { error: itemError } = await supabase.from("stock_count_items").insert(items.map(item=>({
    organization_id: organizationId, stock_count_id: count.id, product_id: item.product_id,
    system_quantity: quantityMap.get(item.product_id) ?? 0, counted_quantity: item.counted_quantity, notes: item.notes,
  })));
  if (itemError) {
    await supabase.from("stock_counts").delete().eq("id",count.id).eq("organization_id",organizationId);
    return NextResponse.json({ error: "Item opname gagal disimpan. Draft dibatalkan." }, { status: 400 });
  }
  return NextResponse.json({ count }, { status: 201 });
}
