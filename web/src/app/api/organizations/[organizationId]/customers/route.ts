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
  if (!member || !["owner", "admin", "manager", "staff"].includes(member.role))
    return NextResponse.json({ error: "Tidak memiliki akses menambahkan pelanggan." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 }); }
  const input = body as { code?: unknown; name?: unknown; phone?: unknown; address?: unknown; notes?: unknown };
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const code = typeof input.code === "string" ? input.code.trim() : "";
  const phone = typeof input.phone === "string" ? input.phone.trim() : "";
  const address = typeof input.address === "string" ? input.address.trim() : "";
  const notes = typeof input.notes === "string" ? input.notes.trim() : "";
  if (name.length < 2 || name.length > 120) return NextResponse.json({ error: "Nama pelanggan wajib 2–120 karakter." }, { status: 400 });
  if (code.length > 30 || phone.length > 40 || address.length > 300 || notes.length > 500) return NextResponse.json({ error: "Ada data pelanggan yang melebihi batas karakter." }, { status: 400 });
  const { data, error } = await supabase.from("customers").insert({
    organization_id: organizationId, created_by: userId, code: code || null,
    name, phone: phone || null, address: address || null, notes: notes || null,
  }).select("id, code, name, phone, address, is_active").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Kode pelanggan sudah digunakan." : "Pelanggan gagal disimpan." }, { status: 400 });
  return NextResponse.json({ customer: data }, { status: 201 });
}
