import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ organizationId: string; documentId: string }> }) {
  const { organizationId, documentId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  const { data: member } = await supabase.from("organization_members").select("role")
    .eq("organization_id", organizationId).eq("user_id", userId).maybeSingle();
  if (!member || !["owner", "admin", "manager"].includes(member.role))
    return NextResponse.json({ error: "Hanya owner, admin, atau manager yang dapat memposting transaksi." }, { status: 403 });
  const { error } = await supabase.rpc("post_stock_document", { p_document_id: documentId });
  if (error) {
    const message = error.message.includes("Insufficient stock") ? "Stok tidak mencukupi untuk transaksi ini." :
      error.message.includes("Only draft") ? "Hanya transaksi draft yang dapat diposting." :
      error.message.includes("at least one item") ? "Tambahkan minimal satu item." :
      "Transaksi gagal diposting. Periksa stok dan status dokumen.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  return NextResponse.json({ success: true });
}
