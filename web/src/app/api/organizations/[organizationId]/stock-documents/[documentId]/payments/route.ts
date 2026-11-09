import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: Promise<{ organizationId: string; documentId: string }> }) {
  const { organizationId, documentId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Sesi tidak valid." }, { status: 401 });
  const { data: member } = await supabase.from("organization_members").select("role")
    .eq("organization_id", organizationId).eq("user_id", userId).maybeSingle();
  if (!member || !["owner", "admin", "manager", "staff"].includes(member.role))
    return NextResponse.json({ error: "Tidak memiliki akses menerima pembayaran." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Format data tidak valid." }, { status: 400 }); }
  const input = body as { amount?: unknown; payment_method?: unknown; reference_number?: unknown; notes?: unknown };
  const amount = Number(input.amount);
  const method = input.payment_method;
  if (!Number.isFinite(amount) || amount <= 0) return NextResponse.json({ error: "Jumlah pembayaran harus lebih dari nol." }, { status: 400 });
  if (!["CASH", "BANK_TRANSFER", "QRIS"].includes(String(method))) return NextResponse.json({ error: "Metode pembayaran tidak valid." }, { status: 400 });
  const reference = typeof input.reference_number === "string" ? input.reference_number.trim() : "";
  const notes = typeof input.notes === "string" ? input.notes.trim() : "";
  if (reference.length > 100 || notes.length > 500) return NextResponse.json({ error: "Referensi atau catatan terlalu panjang." }, { status: 400 });
  const { data, error } = await supabase.rpc("record_customer_payment", {
    p_document_id: documentId, p_amount: amount, p_payment_method: method,
    p_reference_number: reference || null, p_notes: notes || null,
  });
  if (error) {
    const message = error.message.includes("PAYMENT_EXCEEDS_OUTSTANDING") ? "Pembayaran melebihi sisa tagihan."
      : error.message.includes("ALREADY_PAID") ? "Nota ini sudah lunas."
      : error.message.includes("DOCUMENT_NOT_PAYABLE") ? "Pembayaran hanya bisa dicatat untuk penjualan yang sudah diposting."
      : error.message.includes("DOCUMENT_NOT_FOUND") ? "Nota tidak ditemukan."
      : error.message.includes("ACCESS_DENIED") ? "Akses pembayaran ditolak."
      : "Pembayaran gagal disimpan. Periksa data dan coba lagi.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  return NextResponse.json({ payment_id: data }, { status: 201 });
}
