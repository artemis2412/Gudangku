import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ organizationId: string; warehouseId: string }> }) {
  const { organizationId, warehouseId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });

  const { data: member } = await supabase.from("organization_members").select("role")
    .eq("organization_id", organizationId).eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Akses organisasi ditolak." }, { status: 403 });
  if (!["owner", "admin", "manager"].includes(member.role)) return NextResponse.json({ error: "Akses mengelola gudang ditolak." }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 }); }
  const input = body as { timeZone?: unknown };
  const timeZone = typeof input.timeZone === "string" ? input.timeZone.trim() : "";
  if (!timeZone) return NextResponse.json({ error: "Zona waktu perangkat tidak valid." }, { status: 400 });
  try { new Intl.DateTimeFormat("id-ID", { timeZone }).format(new Date()); }
  catch { return NextResponse.json({ error: "Zona waktu perangkat tidak dikenali." }, { status: 400 }); }

  const { data, error } = await supabase.from("warehouses")
    .update({ time_zone: timeZone })
    .eq("id", warehouseId).eq("organization_id", organizationId)
    .select("id, time_zone").maybeSingle();
  if (error) return NextResponse.json({ error: "Zona waktu gudang gagal diperbarui." }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Gudang tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ warehouse: data });
}
