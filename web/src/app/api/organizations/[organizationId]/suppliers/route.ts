import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest,{params}:{params:Promise<{organizationId:string}>}) {
 const {organizationId}=await params;const supabase=await createClient();
 const {data:claims}=await supabase.auth.getClaims();const userId=claims?.claims?.sub;
 if(!userId)return NextResponse.json({error:"Sesi tidak valid."},{status:401});
 const {data:member}=await supabase.from("organization_members").select("role").eq("organization_id",organizationId).eq("user_id",userId).maybeSingle();
 if(!member||!["owner","admin","manager"].includes(member.role))return NextResponse.json({error:"Hanya owner, admin, atau manager yang dapat mengelola supplier."},{status:403});
 let body:unknown;try{body=await request.json()}catch{return NextResponse.json({error:"Format data tidak valid."},{status:400})}
 const input=body as Record<string,unknown>;const name=typeof input.name==="string"?input.name.trim():"";
 if(!name||name.length>160)return NextResponse.json({error:"Nama supplier wajib diisi (maksimal 160 karakter)."},{status:400});
 const value=(key:string,max:number)=>typeof input[key]==="string"?String(input[key]).trim().slice(0,max)||null:null;
 const {data,error}=await supabase.from("suppliers").insert({
  organization_id:organizationId,name,code:value("code",40),contact_person:value("contact_person",120),
  phone:value("phone",40),email:value("email",160),address:value("address",500),notes:value("notes",1000)
 }).select("id,name,code,phone").single();
 if(error)return NextResponse.json({error:"Supplier gagal disimpan. Periksa kemungkinan kode supplier sudah digunakan."},{status:400});
 return NextResponse.json({supplier:data},{status:201});
}
