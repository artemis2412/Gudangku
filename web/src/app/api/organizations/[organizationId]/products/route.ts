import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  const { data: member } = await supabase.from("organization_members").select("role")
    .eq("organization_id", organizationId).eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Akses organisasi ditolak." }, { status: 403 });
  if (!["owner", "admin", "manager"].includes(member.role)) return NextResponse.json({ error: "Hanya owner, admin, atau manager yang dapat mengelola produk." }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 }); }
  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const sku = typeof input.sku === "string" ? input.sku.trim() : "";
  const barcode = typeof input.barcode === "string" ? input.barcode.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const categoryId = typeof input.category_id === "string" && input.category_id ? input.category_id : null;
  const unitId = typeof input.unit_id === "string" && input.unit_id ? input.unit_id : null;
  const minimumStock = Number(input.minimum_stock ?? 0);
  const purchasePrice = Number(input.purchase_price ?? 0);
  const sellingPrice = Number(input.selling_price ?? 0);
  if (name.length < 2 || name.length > 150) return NextResponse.json({ error: "Nama produk harus 2–150 karakter." }, { status: 400 });
  if (sku.length > 60 || barcode.length > 80 || description.length > 1000) return NextResponse.json({ error: "SKU, barcode, atau deskripsi terlalu panjang." }, { status: 400 });
  if (![minimumStock, purchasePrice, sellingPrice].every(value => Number.isFinite(value) && value >= 0)) return NextResponse.json({ error: "Stok minimum dan harga harus berupa angka nol atau lebih." }, { status: 400 });

  if (categoryId) {
    const { data: category } = await supabase.from("product_categories").select("id")
      .eq("id", categoryId).eq("organization_id", organizationId).maybeSingle();
    if (!category) return NextResponse.json({ error: "Kategori tidak valid untuk organisasi ini." }, { status: 400 });
  }
  if (unitId) {
    const { data: unit } = await supabase.from("units").select("id")
      .eq("id", unitId).eq("organization_id", organizationId).maybeSingle();
    if (!unit) return NextResponse.json({ error: "Satuan tidak valid untuk organisasi ini." }, { status: 400 });
  }

  const { data, error } = await supabase.from("products").insert({
    organization_id: organizationId, name, sku: sku || null, barcode: barcode || null,
    description: description || null, category_id: categoryId, unit_id: unitId,
    minimum_stock: minimumStock, purchase_price: purchasePrice, selling_price: sellingPrice, is_active: true,
  }).select("id, name, sku, barcode, minimum_stock, purchase_price, selling_price, is_active").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "SKU atau barcode sudah digunakan." : "Produk gagal disimpan. Pastikan kategori dan satuan berasal dari organisasi ini." }, { status: 400 });
  return NextResponse.json({ product: data }, { status: 201 });
}
