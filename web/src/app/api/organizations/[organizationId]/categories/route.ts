import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  const { data: member } = await supabase.from("organization_members").select("role").eq("organization_id", organizationId).eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Akses organisasi ditolak." }, { status: 403 });
  if (!["owner", "admin", "manager"].includes(member.role)) return NextResponse.json({ error: "Hanya owner, admin, atau manager yang dapat mengelola kategori." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 }); }
  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  if (name.length < 2 || name.length > 100) return NextResponse.json({ error: "Nama kategori harus 2–100 karakter." }, { status: 400 });
  if (description.length > 500) return NextResponse.json({ error: "Deskripsi maksimal 500 karakter." }, { status: 400 });
  const { data, error } = await supabase.from("product_categories").insert({ organization_id: organizationId, name, description: description || null }).select("id,name,description,created_at").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Nama kategori sudah digunakan." : "Kategori gagal disimpan." }, { status: 400 });
  return NextResponse.json({ category: data }, { status: 201 });
}


export async function PATCH(request: NextRequest, { params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  const { data: member } = await supabase.from("organization_members").select("role").eq("organization_id", organizationId).eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Akses organisasi ditolak." }, { status: 403 });
  if (!["owner", "admin", "manager"].includes(member.role)) return NextResponse.json({ error: "Akses mengelola kategori ditolak." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 }); }
  const input = body as Record<string, unknown>;
  const id = typeof input.id === "string" ? input.id : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  if (!id) return NextResponse.json({ error: "Kategori tidak valid." }, { status: 400 });
  if (name.length < 2 || name.length > 100) return NextResponse.json({ error: "Nama kategori harus 2–100 karakter." }, { status: 400 });
  if (description.length > 500) return NextResponse.json({ error: "Deskripsi maksimal 500 karakter." }, { status: 400 });
  const { data, error } = await supabase.from("product_categories").update({ name, description: description || null }).eq("id", id).eq("organization_id", organizationId).select("id,name,description").maybeSingle();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Nama kategori sudah digunakan." : "Kategori gagal diperbarui." }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Kategori tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ category: data });
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  const { data: member } = await supabase.from("organization_members").select("role").eq("organization_id", organizationId).eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Akses organisasi ditolak." }, { status: 403 });
  if (!["owner", "admin", "manager"].includes(member.role)) return NextResponse.json({ error: "Akses mengelola kategori ditolak." }, { status: 403 });
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Kategori tidak valid." }, { status: 400 });
  const { count, error: usageError } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("category_id", id);
  if (usageError) return NextResponse.json({ error: "Penggunaan kategori gagal diperiksa." }, { status: 400 });
  if ((count ?? 0) > 0) return NextResponse.json({ error: "Kategori masih dipakai produk. Ubah kategori produk terlebih dahulu." }, { status: 409 });
  const { error } = await supabase.from("product_categories").delete().eq("id", id).eq("organization_id", organizationId);
  if (error) return NextResponse.json({ error: "Kategori gagal dihapus." }, { status: 400 });
  return NextResponse.json({ success: true });
}
