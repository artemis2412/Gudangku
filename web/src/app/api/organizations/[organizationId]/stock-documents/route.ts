import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
type ItemInput = { product_id?: unknown; quantity?: unknown; unit_cost?: unknown; notes?: unknown; sales_unit?: unknown; sales_quantity?: unknown; unit_price?: unknown };
export async function POST(request: NextRequest, { params }: { params: Promise<{ organizationId: string }> }) {
 const {organizationId}=await params;const supabase=await createClient();
 const {data:claimsData}=await supabase.auth.getClaims();const userId=claimsData?.claims?.sub;
 if(!userId)return NextResponse.json({error:"Sesi tidak valid."},{status:401});
 const {data:member}=await supabase.from("organization_members").select("role").eq("organization_id",organizationId).eq("user_id",userId).maybeSingle();
 if(!member||!["owner","admin","manager","staff"].includes(member.role))return NextResponse.json({error:"Tidak memiliki akses membuat transaksi."},{status:403});
 let body:unknown;try{body=await request.json();}catch{return NextResponse.json({error:"Format data tidak valid."},{status:400});}
 const input=body as {document_type?:unknown;source_warehouse_id?:unknown;destination_warehouse_id?:unknown;customer_id?:unknown;notes?:unknown;reference_number?:unknown;occurred_at?:unknown;items?:unknown;discount_amount?:unknown;payment_method?:unknown;amount_received?:unknown};
 const type=input.document_type;if(type!=="IN"&&type!=="OUT"&&type!=="TRANSFER")return NextResponse.json({error:"Jenis transaksi tidak valid."},{status:400});
 const customerId=type==="OUT"&&typeof input.customer_id==="string"&&input.customer_id?input.customer_id:null;
 if(type==="OUT"&&input.customer_id&&!customerId)return NextResponse.json({error:"Pelanggan tidak valid."},{status:400});
 if(customerId){const {data:customer}=await supabase.from("customers").select("id").eq("id",customerId).eq("organization_id",organizationId).eq("is_active",true).maybeSingle();if(!customer)return NextResponse.json({error:"Pelanggan tidak ditemukan atau nonaktif."},{status:400});}
 const source=typeof input.source_warehouse_id==="string"?input.source_warehouse_id:null;
 const destination=typeof input.destination_warehouse_id==="string"?input.destination_warehouse_id:null;
 if((type==="IN"&&!destination)||(type==="OUT"&&!source)||(type==="TRANSFER"&&(!source||!destination||source===destination)))return NextResponse.json({error:"Gudang asal/tujuan belum benar."},{status:400});
 const rawItems=Array.isArray(input.items)?input.items as ItemInput[]:[];
 if(rawItems.length<1||rawItems.length>200)return NextResponse.json({error:"Transaksi harus memiliki 1–200 item."},{status:400});
 const productIds=rawItems.map(x=>typeof x.product_id==="string"?x.product_id:"");
 if(productIds.some(x=>!x)||new Set(productIds).size!==productIds.length)return NextResponse.json({error:"Produk kosong atau duplikat dalam satu transaksi."},{status:400});
 const {data:products}=await supabase.from("products").select("id,pieces_per_carton,piece_selling_price,carton_selling_price,selling_price,purchase_price").eq("organization_id",organizationId).eq("is_active",true).in("id",productIds);
 if((products?.length??0)!==productIds.length)return NextResponse.json({error:"Ada produk tidak valid atau nonaktif."},{status:400});
 const productMap=new Map(products!.map(p=>[p.id,p]));
 const items=[] as Array<{product_id:string;quantity:number;unit_cost:number;notes:string|null;sales_unit:string;sales_quantity:number;unit_price:number;line_total:number}>;
 for(const raw of rawItems){
  const product=productMap.get(String(raw.product_id))!;
  const enteredQuantity=Number(type==="OUT"?raw.sales_quantity:raw.quantity);
  const unitCost=Number(raw.unit_cost??product.purchase_price??0);
  const salesUnit=type==="OUT"?(raw.sales_unit==="CARTON"?"CARTON":raw.sales_unit==="PCS"?"PCS":""):"BASE";
  const unitPrice=type==="OUT"?Number(raw.unit_price):0;
  if(!Number.isFinite(enteredQuantity)||enteredQuantity<=0||!Number.isFinite(unitCost)||unitCost<0)return NextResponse.json({error:"Jumlah dan biaya modal harus berupa angka valid."},{status:400});
  if(type==="OUT"&&(!salesUnit||!Number.isFinite(unitPrice)||unitPrice<0))return NextResponse.json({error:"Satuan jual dan harga jual harus valid."},{status:400});
  if(type==="OUT"&&salesUnit==="CARTON"&&(!product.pieces_per_carton||product.pieces_per_carton<=0))return NextResponse.json({error:"Isi per dus belum diatur pada master produk."},{status:400});
  const quantity=type==="OUT"&&salesUnit==="CARTON"?enteredQuantity*Number(product.pieces_per_carton):enteredQuantity;
  if(!Number.isFinite(quantity)||quantity<=0||quantity>999999999)return NextResponse.json({error:"Konversi jumlah barang tidak valid."},{status:400});
  items.push({product_id:String(raw.product_id),quantity,unit_cost:unitCost,notes:typeof raw.notes==="string"?raw.notes.trim().slice(0,250):null,sales_unit:salesUnit,sales_quantity:enteredQuantity,unit_price:unitPrice,line_total:type==="OUT"?Math.round(enteredQuantity*unitPrice*100)/100:0});
 }
 const warehouseIds=[source,destination].filter((id):id is string=>Boolean(id));
 const {data:warehouses}=await supabase.from("warehouses").select("id").eq("organization_id",organizationId).in("id",warehouseIds).eq("is_active",true);
 if((warehouses?.length??0)!==new Set(warehouseIds).size)return NextResponse.json({error:"Gudang tidak valid atau tidak aktif."},{status:400});
 const subtotal=type==="OUT"?Math.round(items.reduce((sum,item)=>sum+item.line_total,0)*100)/100:0;
 const discount=type==="OUT"?Number(input.discount_amount??0):0;
 const allowedPaymentMethods=["CASH","BANK_TRANSFER","QRIS","CREDIT"];if(type==="OUT"&&!allowedPaymentMethods.includes(String(input.payment_method??"CASH")))return NextResponse.json({error:"Metode pembayaran tidak valid."},{status:400});const paymentMethod=type==="OUT"?String(input.payment_method??"CASH"):"CASH";
 const received=type==="OUT"?Number(input.amount_received??0):0;
 if(type==="OUT"&&(!Number.isFinite(discount)||discount<0||discount>subtotal||!Number.isFinite(received)||received<0))return NextResponse.json({error:"Diskon atau uang diterima tidak valid."},{status:400});
 const grandTotal=Math.round((subtotal-discount)*100)/100;
 if(type==="OUT"&&paymentMethod!=="CASH"&&received>grandTotal)return NextResponse.json({error:"Uang diterima tidak boleh melebihi total untuk metode pembayaran ini."},{status:400});
 const change=paymentMethod==="CASH"?Math.max(0,Math.round((received-grandTotal)*100)/100):0;
 const paymentStatus=received===0?"UNPAID":received>=grandTotal?"PAID":"PARTIAL";
 const now=new Date();const occurredAt=typeof input.occurred_at==="string"&&!Number.isNaN(Date.parse(input.occurred_at))?new Date(input.occurred_at).toISOString():now.toISOString();
 const documentNumber=`GDG-${type}-${now.toISOString().replace(/[-:TZ.]/g,"").slice(0,14)}-${Math.random().toString(36).slice(2,6).toUpperCase()}`;
 const {data:document,error:documentError}=await supabase.from("stock_documents").insert({
  organization_id:organizationId,document_number:documentNumber,document_type:type,status:"DRAFT",source_warehouse_id:source,destination_warehouse_id:destination,customer_id:customerId,
  notes:typeof input.notes==="string"?input.notes.trim().slice(0,1000)||null:null,
  reference_number:typeof input.reference_number==="string"?input.reference_number.trim().slice(0,100)||null:null,
  occurred_at:occurredAt,created_by:userId,subtotal_amount:subtotal,discount_amount:discount,grand_total:grandTotal,payment_method:paymentMethod,amount_received:received,change_amount:change,payment_status:paymentStatus,
 }).select("id,document_number").single();
 if(documentError||!document)return NextResponse.json({error:"Dokumen transaksi gagal dibuat."},{status:400});
 const {error:itemError}=await supabase.from("stock_document_items").insert(items.map(item=>({...item,organization_id:organizationId,document_id:document.id})));
 if(itemError){await supabase.from("stock_documents").delete().eq("id",document.id).eq("organization_id",organizationId);return NextResponse.json({error:"Item transaksi gagal disimpan. Draft dibatalkan; periksa kembali data produk."},{status:400});}
 return NextResponse.json({document,subtotal,discount_amount:discount,grand_total:grandTotal,amount_received:received,change_amount:change,payment_status:paymentStatus},{status:201});
}
