"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function CustomerForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`/api/organizations/${organizationId}/customers`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, phone, address, notes }),
      });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Pelanggan gagal disimpan."); return; }
      setName(""); setCode(""); setPhone(""); setAddress(""); setNotes(""); router.refresh();
    } catch { setError("Koneksi bermasalah. Coba lagi."); }
    finally { setBusy(false); }
  }
  return <form className="master-form" onSubmit={submit}>
    <label htmlFor="customer-name">Nama pelanggan</label><input id="customer-name" value={name} onChange={e => setName(e.target.value)} maxLength={120} required />
    <label htmlFor="customer-code">Kode pelanggan (opsional)</label><input id="customer-code" value={code} onChange={e => setCode(e.target.value)} maxLength={30} />
    <label htmlFor="customer-phone">Nomor telepon / WhatsApp</label><input id="customer-phone" value={phone} onChange={e => setPhone(e.target.value)} maxLength={40} />
    <label htmlFor="customer-address">Alamat</label><textarea id="customer-address" value={address} onChange={e => setAddress(e.target.value)} maxLength={300} rows={2} />
    <label htmlFor="customer-notes">Catatan</label><textarea id="customer-notes" value={notes} onChange={e => setNotes(e.target.value)} maxLength={500} rows={2} />
    {error && <p className="form-error">{error}</p>}<button className="primary-button auth-submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan pelanggan"}</button>
  </form>;
}
