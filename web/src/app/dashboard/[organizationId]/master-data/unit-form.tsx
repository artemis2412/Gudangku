"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function UnitForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`/api/organizations/${organizationId}/units`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, abbreviation }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Satuan gagal disimpan."); return; }
      setName(""); setAbbreviation(""); router.refresh();
    } catch { setError("Koneksi bermasalah. Coba lagi."); }
    finally { setBusy(false); }
  }
  return <form className="master-form" onSubmit={submit}>
    <label htmlFor="unit-name">Nama satuan</label><input id="unit-name" value={name} onChange={e => setName(e.target.value)} maxLength={60} placeholder="Contoh: Pieces" required />
    <label htmlFor="unit-abbreviation">Singkatan</label><input id="unit-abbreviation" value={abbreviation} onChange={e => setAbbreviation(e.target.value)} maxLength={12} placeholder="Contoh: pcs" required />
    {error && <p className="form-error">{error}</p>}<button className="primary-button auth-submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan satuan"}</button>
  </form>;
}
