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
  if (!["owner", "admin", "manager"].includes(member.role)) return NextResponse.json({ error: "Hanya owner, admin, atau manager yang dapat mengelola satuan." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 }); }
  const input = body as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const abbreviation = typeof input.abbreviation === "string" ? input.abbreviation.trim() : "";
  if (name.length < 1 || name.length > 60) return NextResponse.json({ error: "Nama satuan harus 1–60 karakter." }, { status: 400 });
  if (abbreviation.length < 1 || abbreviation.length > 12) return NextResponse.json({ error: "Singkatan satuan harus 1–12 karakter." }, { status: 400 });
  const { data, error } = await supabase.from("units").insert({ organization_id: organizationId, name, abbreviation }).select("id,name,abbreviation,created_at").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Nama atau singkatan satuan sudah digunakan." : "Satuan gagal disimpan." }, { status: 400 });
  return NextResponse.json({ unit: data }, { status: 201 });
}
