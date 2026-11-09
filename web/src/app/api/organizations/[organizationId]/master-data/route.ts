import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  const { data: member } = await supabase.from("organization_members").select("role").eq("organization_id", organizationId).eq("user_id", userId).maybeSingle();
  if (!member || !["owner", "admin", "manager"].includes(member.role)) return NextResponse.json({ error: "Hanya owner, admin, atau manager yang dapat mengelola kategori dan satuan." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 }); }
  const input = body as { kind?: unknown; name?: unknown; description?: unknown; abbreviation?: unknown };
  const kind = input.kind;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (name.length < 1 || name.length > 80) return NextResponse.json({ error: "Nama harus 1–80 karakter." }, { status: 400 });
  if (kind === "category") {
    const description = typeof input.description === "string" ? input.description.trim() : "";
    if (description.length > 250) return NextResponse.json({ error: "Deskripsi maksimal 250 karakter." }, { status: 400 });
    const { data, error } = await supabase.from("product_categories").insert({ organization_id: organizationId, name, description: description || null }).select("id,name,description").single();
    if (error) return NextResponse.json({ error: error.code === "23505" ? "Kategori dengan nama tersebut sudah ada." : "Kategori gagal disimpan." }, { status: 400 });
    return NextResponse.json({ item: data }, { status: 201 });
  }
  if (kind === "unit") {
    const abbreviation = typeof input.abbreviation === "string" ? input.abbreviation.trim() : "";
    if (abbreviation.length < 1 || abbreviation.length > 12) return NextResponse.json({ error: "Singkatan satuan wajib diisi (maksimal 12 karakter)." }, { status: 400 });
    const { data, error } = await supabase.from("units").insert({ organization_id: organizationId, name, abbreviation }).select("id,name,abbreviation").single();
    if (error) return NextResponse.json({ error: error.code === "23505" ? "Nama atau singkatan satuan sudah digunakan." : "Satuan gagal disimpan." }, { status: 400 });
    return NextResponse.json({ item: data }, { status: 201 });
  }
  return NextResponse.json({ error: "Jenis data tidak dikenal." }, { status: 400 });
}
