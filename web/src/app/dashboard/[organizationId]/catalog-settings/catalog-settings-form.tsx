"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function CatalogSettingsForm({ organizationId, kind }: { organizationId: string; kind: "category" | "unit" }) {
  const router = useRouter();
  const [name, setName] = useState(""); const [description, setDescription] = useState(""); const [abbreviation, setAbbreviation] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`/api/organizations/${organizationId}/master-data`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, name, description, abbreviation }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Data gagal disimpan."); return; }
      setName(""); setDescription(""); setAbbreviation(""); router.refresh();
    } catch { setError("Koneksi bermasalah. Coba lagi."); }
    finally { setBusy(false); }
  }
  return <form className="master-form catalog-settings-form" onSubmit={submit}>
    <label htmlFor={`${kind}-name`}>{kind === "category" ? "Nama kategori baru" : "Nama satuan baru"}</label>
    <input id={`${kind}-name`} value={name} onChange={e => setName(e.target.value)} maxLength={80} placeholder={kind === "category" ? "Contoh: Elektronik" : "Contoh: Kilogram"} required/>
    {kind === "category" ? <><label htmlFor="category-description">Deskripsi (opsional)</label><input id="category-description" value={description} onChange={e => setDescription(e.target.value)} maxLength={250}/></> : <><label htmlFor="unit-abbreviation">Singkatan</label><input id="unit-abbreviation" value={abbreviation} onChange={e => setAbbreviation(e.target.value)} maxLength={12} placeholder="Contoh: kg" required/> </>}
    {error && <p className="form-error">{error}</p>}<button className="primary-button auth-submit" disabled={busy}>{busy ? "Menyimpan..." : kind === "category" ? "Tambah kategori" : "Tambah satuan"}</button>
  </form>;
}
