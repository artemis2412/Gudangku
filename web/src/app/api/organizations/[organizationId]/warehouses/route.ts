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
  if (!["owner", "admin", "manager"].includes(member.role)) return NextResponse.json({ error: "Hanya owner, admin, atau manager yang dapat mengelola gudang." }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 }); }
  const input = body as { code?: unknown; name?: unknown; address?: unknown };
  const code = typeof input.code === "string" ? input.code.trim() : "";
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const address = typeof input.address === "string" ? input.address.trim() : "";
  if (!code || code.length > 30) return NextResponse.json({ error: "Kode gudang wajib diisi (maksimal 30 karakter)." }, { status: 400 });
  if (name.length < 2 || name.length > 100) return NextResponse.json({ error: "Nama gudang harus 2–100 karakter." }, { status: 400 });
  if (address.length > 250) return NextResponse.json({ error: "Alamat maksimal 250 karakter." }, { status: 400 });

  const { data, error } = await supabase.from("warehouses")
    .insert({ organization_id: organizationId, code, name, address: address || null })
    .select("id, code, name, address, is_active").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "Kode gudang sudah digunakan." : "Gudang gagal disimpan. Periksa data dan coba lagi." }, { status: 400 });
  return NextResponse.json({ warehouse: data }, { status: 201 });
}
