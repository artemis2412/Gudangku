import {NextResponse,type NextRequest} from "next/server";
import {createClient} from "@/lib/supabase/server";
type InputItem={original_document_item_id?:unknown;quantity?:unknown};
export async function POST(request:NextRequest,{params}:{params:Promise<{organizationId:string}>}){
 const {organizationId}=await params;const supabase=await createClient();const {data:claims}=await supabase.auth.getClaims();const userId=claims?.claims?.sub;
 if(!userId)return NextResponse.json({error:"Sesi tidak valid."},{status:401});
 const {data:member}=await supabase.from("organization_members").select("role").eq("organization_id",organizationId).eq("user_id",userId).maybeSingle();
 if(!member||!["owner","admin","manager","staff"].includes(member.role))return NextResponse.json({error:"Tidak memiliki akses membuat retur."},{status:403});
 let body:unknown;try{body=await request.json()}catch{return NextResponse.json({error:"Format data tidak valid."},{status:400})}
 const input=body as {return_type?:unknown;original_document_id?:unknown;reason?:unknown;items?:unknown};
 const type=input.return_type;if(type!=="SALES"&&type!=="PURCHASE")return NextResponse.json({error:"Jenis retur tidak valid."},{status:400});
 if(typeof input.original_document_id!=="string")return NextResponse.json({error:"Transaksi asal wajib dipilih."},{status:400});
 const {data:original,error:originalError}=await supabase.from("stock_documents").select("id,document_number,document_type,status,source_warehouse_id,destination_warehouse_id,customer_id,supplier_id,subtotal_amount,discount_amount,stock_document_items(id,product_id,quantity,unit_cost,unit_price,products(name))").eq("organization_id",organizationId).eq("id",input.original_document_id).eq("status","POSTED").eq("document_type",type==="SALES"?"OUT":"IN").maybeSingle();
 if(originalError||!original)return NextResponse.json({error:"Transaksi asal tidak ditemukan atau belum diposting."},{status:400});
 const warehouseId=type==="SALES"?original.source_warehouse_id:original.destination_warehouse_id;
 if(!warehouseId)return NextResponse.json({error:"Gudang transaksi asal tidak valid."},{status:400});
 const raw=Array.isArray(input.items)?input.items as InputItem[]:[];
 if(!raw.length||raw.length>200)return NextResponse.json({error:"Pilih minimal satu item retur."},{status:400});
 const sourceItems=original.stock_document_items as unknown as Array<{id:string;product_id:string;quantity:number|string;unit_cost:number|string;unit_price:number|string;products:{name:string}|null}>;
 const sourceMap=new Map(sourceItems.map(x=>[x.id,x]));\n const originalSubtotal=Number(original.subtotal_amount??0);const discountFactor=originalSubtotal>0?Math.max(0,(originalSubtotal-Number(original.discount_amount??0))/originalSubtotal):1;
 const ids=raw.map(x=>typeof x.original_document_item_id==="string"?x.original_document_item_id:"");
 if(ids.some(x=>!x)||new Set(ids).size!==ids.length)return NextResponse.json({error:"Item retur kosong atau duplikat."},{status:400});
 const {data:prior}=await supabase.from("stock_return_items").select("original_document_item_id,quantity,stock_returns!inner(status)").in("original_document_item_id",ids).eq("organization_id",organizationId).eq("stock_returns.status","POSTED");
 const already=new Map<string,number>();for(const p of prior??[]){already.set(p.original_document_item_id,(already.get(p.original_document_item_id)??0)+Number(p.quantity));}
 const items=[] as Array<{organization_id:string;stock_return_id:string;original_document_item_id:string;product_id:string;quantity:number;unit_cost:number;unit_price:number;line_total:number}>;
 let total=0;
 for(const item of raw){
  const id=String(item.original_document_item_id);const source=sourceMap.get(id);const quantity=Number(item.quantity);
  if(!source||!Number.isFinite(quantity)||quantity<=0)return NextResponse.json({error:"Jumlah atau item retur tidak valid."},{status:400});
  if((already.get(id)??0)+quantity>Number(source.quantity))return NextResponse.json({error:`Jumlah retur melebihi sisa untuk produk ${source.products?.name??""}.`},{status:400});
  const unitCost=Number(source.unit_cost);const unitPrice=Number(source.unit_price);const value=type==="SALES"?unitPrice:unitCost;
  const lineTotal=Math.round(quantity*value*discountFactor*100)/100;total+=lineTotal;
  items.push({organization_id:organizationId,stock_return_id:"",original_document_item_id:id,product_id:source.product_id,quantity,unit_cost:unitCost,unit_price:unitPrice,line_total:lineTotal});
 }
 const now=new Date();const returnNumber=`RTN-${type}-${now.toISOString().replace(/[-:TZ.]/g,"").slice(0,14)}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
 const {data:doc,error}=await supabase.from("stock_returns").insert({organization_id:organizationId,return_number:returnNumber,return_type:type,original_document_id:original.id,warehouse_id:warehouseId,customer_id:type==="SALES"?original.customer_id:null,supplier_id:type==="PURCHASE"?original.supplier_id:null,status:"DRAFT",reason:typeof input.reason==="string"?input.reason.trim().slice(0,500)||null:null,total_amount:Math.round(total*100)/100,created_by:userId}).select("id,return_number").single();
 if(error||!doc)return NextResponse.json({error:"Draft retur gagal dibuat."},{status:400});
 const {error:itemError}=await supabase.from("stock_return_items").insert(items.map(x=>({...x,stock_return_id:doc.id})));
 if(itemError){await supabase.from("stock_returns").delete().eq("id",doc.id).eq("organization_id",organizationId);return NextResponse.json({error:"Item retur gagal disimpan. Draft dibatalkan."},{status:400});}
 return NextResponse.json({return:doc,total_amount:total},{status:201});
}
