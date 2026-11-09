"use client";
import {useState} from "react";
import {useRouter} from "next/navigation";
export function PostReturnButton({organizationId,returnId}:{organizationId:string;returnId:string}){
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");const router=useRouter();
 async function post(){if(!window.confirm("Posting retur ini? Stok akan langsung diperbarui dan dokumen tidak dapat diposting ulang."))return;setBusy(true);setError("");try{const r=await fetch(`/api/organizations/${organizationId}/returns/${returnId}/post`,{method:"POST"});const b=await r.json();if(!r.ok){setError(b.error??"Gagal memposting retur.");return;}router.refresh();}catch{setError("Koneksi bermasalah.");}finally{setBusy(false)}}
 return <div><button type="button" className="post-document-button" onClick={post} disabled={busy}>{busy?"Memproses...":"Posting retur"}</button>{error&&<p className="form-error">{error}</p>}</div>;
}
