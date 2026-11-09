"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export function CompleteStockCountButton({organizationId,countId}:{organizationId:string;countId:string}) {
 const router=useRouter();const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 async function complete(){if(!window.confirm("Selesaikan opname dan terapkan penyesuaian saldo stok? Tindakan ini tidak dapat dibatalkan."))return;setBusy(true);setError("");
  try{const response=await fetch(`/api/organizations/${organizationId}/stock-counts/${countId}/complete`,{method:"POST"});const result=await response.json();if(!response.ok){setError(result.error??"Opname gagal diselesaikan.");return;}router.refresh();}
  catch{setError("Koneksi bermasalah. Coba lagi.");}finally{setBusy(false);}
 }
 return <div className="count-complete-action"><button className="secondary-button" onClick={complete} disabled={busy}>{busy?"Memproses...":"Selesaikan opname"}</button>{error&&<small className="form-error">{error}</small>}</div>;
}
