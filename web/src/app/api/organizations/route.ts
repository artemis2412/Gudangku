import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (!userId) {
    return NextResponse.json({ error: "Sesi tidak valid. Silakan masuk kembali." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Format permintaan tidak valid." }, { status: 400 });
  }

  const name = typeof body === "object" && body !== null && "name" in body
    ? String((body as { name: unknown }).name).trim()
    : "";

  if (name.length < 2 || name.length > 100) {
    return NextResponse.json({ error: "Nama organisasi harus terdiri dari 2–100 karakter." }, { status: 400 });
  }

  const { data: organization, error } = await supabase
    .from("organizations")
    .insert({ name, owner_user_id: userId })
    .select("id, name")
    .single();

  if (error) {
    return NextResponse.json({ error: "Organisasi tidak dapat dibuat. Periksa akses akun atau coba lagi." }, { status: 400 });
  }

  return NextResponse.json({ organization }, { status: 201 });
}
