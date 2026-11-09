import {NextResponse,type NextRequest} from "next/server";
import {createClient} from "@/lib/supabase/server";
export async function POST(_request:NextRequest,{params}:{params:Promise<{organizationId:string;returnId:string}>}){
 const {organizationId,returnId}=await params;const supabase=await createClient();const {data:claims}=await supabase.auth.getClaims();const userId=claims?.claims?.sub;if(!userId)return NextResponse.json({error:"Sesi tidak valid."},{status:401});
 const {data:member}=await supabase.from("organization_members").select("role").eq("organization_id",organizationId).eq("user_id",userId).maybeSingle();if(!member||!["owner","admin","manager"].includes(member.role))return NextResponse.json({error:"Hanya owner, admin, atau manager yang dapat memposting retur."},{status:403});
 const {data:doc}=await supabase.from("stock_returns").select("id").eq("id",returnId).eq("organization_id",organizationId).maybeSingle();if(!doc)return NextResponse.json({error:"Dokumen retur tidak ditemukan."},{status:404});
 const {error}=await supabase.rpc("post_stock_return",{p_return_id:returnId});if(error){const message=error.message.includes("exceeds remaining")?"Jumlah retur melebihi sisa barang yang dapat diretur.":error.message.includes("Insufficient stock")?"Stok tidak cukup untuk retur pembelian.":error.message.includes("Only draft")?"Retur ini sudah diposting atau tidak berstatus draft.":error.message.includes("warehouse")?"Gudang retur tidak sesuai transaksi asal.":"Retur gagal diposting.";return NextResponse.json({error:message},{status:400});}
 return NextResponse.json({success:true});
}
