"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function WarehouseForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    let timeZone = "Asia/Jakarta";
    try { timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || timeZone; } catch { /* use safe fallback */ }
    try {
      const response = await fetch(`/api/organizations/${organizationId}/warehouses`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, name, address, timeZone }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Gudang gagal disimpan."); return; }
      setCode(""); setName(""); setAddress(""); router.refresh();
    } catch { setError("Koneksi bermasalah. Coba lagi."); }
    finally { setBusy(false); }
  }
  return <form className="master-form" onSubmit={submit}>
    <label htmlFor="warehouse-code">Kode gudang</label><input id="warehouse-code" value={code} onChange={e => setCode(e.target.value)} placeholder="Contoh: GDG-01" maxLength={30} required/>
    <label htmlFor="warehouse-name">Nama gudang</label><input id="warehouse-name" value={name} onChange={e => setName(e.target.value)} placeholder="Gudang utama" maxLength={100} required/>
    <label htmlFor="warehouse-address">Alamat (opsional)</label><textarea id="warehouse-address" value={address} onChange={e => setAddress(e.target.value)} placeholder="Alamat atau keterangan lokasi" maxLength={250} rows={3}/>
    <p className="empty-note">Zona waktu akan dideteksi otomatis dari perangkat ini.</p>
    {error && <p className="form-error">{error}</p>}<button className="primary-button auth-submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan gudang"}</button>
  </form>;
}
