"use client";
import {useState,type FormEvent} from "react";
import {useRouter} from "next/navigation";
export function SupplierForm({organizationId}:{organizationId:string}){
 const router=useRouter();const [values,setValues]=useState({name:"",code:"",contact_person:"",phone:"",email:"",address:"",notes:""});const [error,setError]=useState("");const [busy,setBusy]=useState(false);
 function set(key:keyof typeof values,value:string){setValues(v=>({...v,[key]:value}))}
 async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");try{const res=await fetch(`/api/organizations/${organizationId}/suppliers`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(values)});const body=await res.json();if(!res.ok){setError(body.error??"Supplier gagal disimpan.");return;}setValues({name:"",code:"",contact_person:"",phone:"",email:"",address:"",notes:""});router.refresh();}catch{setError("Koneksi bermasalah. Coba lagi.");}finally{setBusy(false)}}
 return <form className="master-form" onSubmit={submit}>
 <label htmlFor="supplier-name">Nama supplier</label><input id="supplier-name" value={values.name} onChange={e=>set("name",e.target.value)} maxLength={160} required/>
 <div className="form-two-columns"><div><label htmlFor="supplier-code">Kode</label><input id="supplier-code" value={values.code} onChange={e=>set("code",e.target.value)} maxLength={40}/></div><div><label htmlFor="supplier-contact">Nama kontak</label><input id="supplier-contact" value={values.contact_person} onChange={e=>set("contact_person",e.target.value)} maxLength={120}/></div></div>
 <label htmlFor="supplier-phone">Nomor telepon</label><input id="supplier-phone" value={values.phone} onChange={e=>set("phone",e.target.value)} maxLength={40}/>
 <label htmlFor="supplier-email">Email</label><input id="supplier-email" type="email" value={values.email} onChange={e=>set("email",e.target.value)} maxLength={160}/>
 <label htmlFor="supplier-address">Alamat</label><textarea id="supplier-address" rows={2} value={values.address} onChange={e=>set("address",e.target.value)} maxLength={500}/>
 <label htmlFor="supplier-notes">Catatan</label><textarea id="supplier-notes" rows={2} value={values.notes} onChange={e=>set("notes",e.target.value)} maxLength={1000}/>
 {error&&<p className="form-error">{error}</p>}<button className="primary-button auth-submit" disabled={busy}>{busy?"Menyimpan...":"Simpan supplier"}</button>
 </form>;
}
