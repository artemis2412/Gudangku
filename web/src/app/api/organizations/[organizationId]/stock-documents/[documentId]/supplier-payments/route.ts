import {NextResponse,type NextRequest} from "next/server";
import {createClient} from "@/lib/supabase/server";
export async function POST(request:NextRequest,{params}:{params:Promise<{organizationId:string;documentId:string}>}){
 const {organizationId,documentId}=await params;const supabase=await createClient();const {data:claims}=await supabase.auth.getClaims();const userId=claims?.claims?.sub;
 if(!userId)return NextResponse.json({error:"Sesi tidak valid."},{status:401});
 const {data:member}=await supabase.from("organization_members").select("role").eq("organization_id",organizationId).eq("user_id",userId).maybeSingle();
 if(!member||!["owner","admin","manager","staff"].includes(member.role))return NextResponse.json({error:"Tidak memiliki akses mencatat pembayaran."},{status:403});
 let body:unknown;try{body=await request.json()}catch{return NextResponse.json({error:"Format data tidak valid."},{status:400})}
 const input=body as Record<string,unknown>;const amount=Number(input.amount);const method=String(input.payment_method??"");
 if(!Number.isFinite(amount)||amount<=0)return NextResponse.json({error:"Jumlah pembayaran harus lebih dari nol."},{status:400});
 if(!["CASH","BANK_TRANSFER","QRIS"].includes(method))return NextResponse.json({error:"Metode pembayaran tidak valid."},{status:400});
 const {data:doc}=await supabase.from("stock_documents").select("id").eq("id",documentId).eq("organization_id",organizationId).eq("document_type","IN").maybeSingle();
 if(!doc)return NextResponse.json({error:"Dokumen pembelian tidak ditemukan."},{status:404});
 const {data,error}=await supabase.rpc("record_supplier_payment",{p_document_id:documentId,p_amount:amount,p_payment_method:method,p_reference_number:typeof input.reference_number==="string"?input.reference_number.slice(0,100):null,p_notes:typeof input.notes==="string"?input.notes.slice(0,500):null});
 if(error){const message=error.message.includes("exceeds")?"Pembayaran melebihi sisa utang.":error.message.includes("already")?"Pembelian sudah lunas.":error.message.includes("posted")?"Posting pembelian terlebih dahulu.":"Pembayaran supplier gagal disimpan.";return NextResponse.json({error:message},{status:400});}
 return NextResponse.json({payment_id:data},{status:201});
}
