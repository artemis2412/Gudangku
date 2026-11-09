import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ organizationId: string; countId: string }> }) {
  const { organizationId, countId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  const { data: member } = await supabase.from("organization_members").select("role").eq("organization_id",organizationId).eq("user_id",userId).maybeSingle();
  if (!member || !["owner","admin","manager"].includes(member.role)) return NextResponse.json({ error: "Hanya owner, admin, atau manager yang dapat menyelesaikan opname." }, { status: 403 });
  const { data: count } = await supabase.from("stock_counts").select("id").eq("organization_id",organizationId).eq("id",countId).maybeSingle();
  if (!count) return NextResponse.json({ error: "Dokumen opname tidak ditemukan." }, { status: 404 });
  const { error } = await supabase.rpc("complete_stock_count",{p_stock_count_id:countId});
  if (error) {
    const message = error.message.includes("Stock changed during count") ? "Stok berubah sejak opname dimulai. Buat opname baru agar penyesuaian tetap akurat." :
      error.message.includes("Only draft") ? "Hanya draft opname yang dapat diselesaikan." :
      error.message.includes("at least one item") ? "Opname belum memiliki item." : "Opname gagal diselesaikan. Periksa kembali data stok.";
    return NextResponse.json({error:message},{status:400});
  }
  return NextResponse.json({success:true});
}
