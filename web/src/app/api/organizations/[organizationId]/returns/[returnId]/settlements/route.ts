import {NextResponse,type NextRequest} from "next/server";
import {createClient} from "@/lib/supabase/server";
export async function POST(request:NextRequest,{params}:{params:Promise<{organizationId:string;returnId:string}>}){
 const {organizationId,returnId}=await params;const supabase=await createClient();const {data:claims}=await supabase.auth.getClaims();const userId=claims?.claims?.sub;if(!userId)return NextResponse.json({error:"Sesi tidak valid."},{status:401});
 const {data:member}=await supabase.from("organization_members").select("role").eq("organization_id",organizationId).eq("user_id",userId).maybeSingle();if(!member||!["owner","admin","manager"].includes(member.role))return NextResponse.json({error:"Hanya owner, admin, atau manager yang dapat mencatat penyelesaian retur."},{status:403});
 let body:unknown;try{body=await request.json()}catch{return NextResponse.json({error:"Format data tidak valid."},{status:400})}
 const input=body as Record<string,unknown>;const amount=Number(input.amount);const method=String(input.payment_method??"");
 if(!Number.isFinite(amount)||amount<=0)return NextResponse.json({error:"Jumlah penyelesaian harus lebih dari nol."},{status:400});
 if(!["CASH","BANK_TRANSFER","QRIS","CREDIT_NOTE"].includes(method))return NextResponse.json({error:"Metode penyelesaian tidak valid."},{status:400});
 const {data:doc}=await supabase.from("stock_returns").select("id").eq("id",returnId).eq("organization_id",organizationId).maybeSingle();if(!doc)return NextResponse.json({error:"Dokumen retur tidak ditemukan."},{status:404});
 const {data,error}=await supabase.rpc("record_stock_return_settlement",{p_return_id:returnId,p_amount:amount,p_payment_method:method,p_reference_number:typeof input.reference_number==="string"?input.reference_number.slice(0,100):null,p_notes:typeof input.notes==="string"?input.notes.slice(0,500):null});
 if(error){const msg=error.message.includes("exceeds")?"Jumlah melebihi sisa nilai retur.":error.message.includes("Only posted")?"Posting retur terlebih dahulu.":error.message.includes("Customer refunds")?"Refund pelanggan harus tunai, transfer, atau QRIS.":"Penyelesaian retur gagal disimpan.";return NextResponse.json({error:msg},{status:400});}
 return NextResponse.json({settlement_id:data},{status:201});
}
