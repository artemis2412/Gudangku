"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type Unit = { id: string; name: string; abbreviation: string };
export function UnitList({ organizationId, items, canManage }: { organizationId: string; items: Unit[]; canManage: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [abbreviation, setAbbreviation] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function start(item: Unit) { setEditing(item.id); setName(item.name); setAbbreviation(item.abbreviation); setError(""); }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editing) return; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/organizations/${organizationId}/units`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing, name, abbreviation }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Satuan gagal diperbarui."); return; }
      setEditing(null); router.refresh();
    } catch { setError("Koneksi bermasalah."); } finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (!window.confirm("Hapus satuan ini?")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/organizations/${organizationId}/units?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Satuan gagal dihapus."); return; }
      router.refresh();
    } catch { setError("Koneksi bermasalah."); } finally { setBusy(false); }
  }
  return <div className="master-list-wrap">
    <ul className="master-list">{items.map(item => <li key={item.id}>
      {canManage && editing === item.id ? <form className="master-inline-edit" onSubmit={save}>
        <label>Nama satuan<input value={name} onChange={e => setName(e.target.value)} maxLength={60} required /></label>
        <label>Singkatan<input value={abbreviation} onChange={e => setAbbreviation(e.target.value)} maxLength={12} required /></label>
        <div className="master-row-actions"><button className="post-document-button" disabled={busy}>Simpan</button><button type="button" className="text-button" onClick={() => setEditing(null)}>Batal</button></div>
      </form> : <><div className="master-item-copy"><strong>{item.name}</strong><span>{item.abbreviation}</span></div>{canManage && <div className="master-row-actions"><button className="text-button" onClick={() => start(item)} disabled={busy}>Edit</button><button className="text-button danger-text" onClick={() => remove(item.id)} disabled={busy}>Hapus</button></div>}</>}
    </li>)}</ul>
    {error && <p className="form-error">{error}</p>}
  </div>;
}
