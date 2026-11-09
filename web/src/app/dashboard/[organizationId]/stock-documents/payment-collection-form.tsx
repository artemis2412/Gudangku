"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const money=(value:number)=>new Intl.NumberFormat("id-ID",{style:"currency",currency:"IDR",maximumFractionDigits:0}).format(value);
export function PaymentCollectionForm({organizationId,documentId,outstanding}:{organizationId:string;documentId:string;outstanding:number}) {
  const router=useRouter();
  const [amount,setAmount]=useState(String(outstanding));
  const [method,setMethod]=useState<"CASH"|"BANK_TRANSFER"|"QRIS">("CASH");
  const [reference,setReference]=useState("");
  const [notes,setNotes]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  async function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();setBusy(true);setError("");
    try{
      const response=await fetch(`/api/organizations/${organizationId}/stock-documents/${documentId}/payments`,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({amount:Number(amount),payment_method:method,reference_number:reference,notes})
      });
      const result=await response.json();
      if(!response.ok){setError(result.error||"Pembayaran gagal disimpan.");return;}
      router.refresh();
    }catch{setError("Koneksi bermasalah. Coba lagi.");}
    finally{setBusy(false);}
  }
  return <form className="payment-collection-form" onSubmit={submit}>
    <div className="payment-outstanding"><span>Sisa tagihan</span><strong>{money(outstanding)}</strong></div>
    <label htmlFor={`payment-amount-${documentId}`}>Jumlah dibayar (Rp)</label>
    <input id={`payment-amount-${documentId}`} type="number" min="1" max={outstanding} step="1" value={amount} onChange={e=>setAmount(e.target.value)} required/>
    <label htmlFor={`payment-method-${documentId}`}>Metode pembayaran</label>
    <select id={`payment-method-${documentId}`} value={method} onChange={e=>setMethod(e.target.value as typeof method)}><option value="CASH">Tunai</option><option value="BANK_TRANSFER">Transfer bank</option><option value="QRIS">QRIS</option></select>
    <label htmlFor={`payment-reference-${documentId}`}>Nomor referensi (opsional)</label>
    <input id={`payment-reference-${documentId}`} value={reference} onChange={e=>setReference(e.target.value)} maxLength={100}/>
    <label htmlFor={`payment-notes-${documentId}`}>Catatan (opsional)</label>
    <input id={`payment-notes-${documentId}`} value={notes} onChange={e=>setNotes(e.target.value)} maxLength={500}/>
    {error&&<p className="form-error">{error}</p>}
    <button className="post-document-button" disabled={busy||!Number(amount)||Number(amount)>outstanding}>{busy?"Menyimpan...":"Catat pembayaran"}</button>
  </form>;
}
