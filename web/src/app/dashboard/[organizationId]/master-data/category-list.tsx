"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type Category = { id: string; name: string; description: string | null };
export function CategoryList({ organizationId, items }: { organizationId: string; items: Category[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  function start(item: Category) { setEditing(item.id); setName(item.name); setDescription(item.description ?? ""); setError(""); }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editing) return; setBusy(true); setError("");
    try {
      const response = await fetch(`/api/organizations/${organizationId}/categories`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing, name, description }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Kategori gagal diperbarui."); return; }
      setEditing(null); router.refresh();
    } catch { setError("Koneksi bermasalah."); } finally { setBusy(false); }
  }
  async function remove(id: string) {
    if (!window.confirm("Hapus kategori ini?")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/organizations/${organizationId}/categories?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Kategori gagal dihapus."); return; }
      router.refresh();
    } catch { setError("Koneksi bermasalah."); } finally { setBusy(false); }
  }
  return <div className="master-list-wrap">
    <ul className="master-list">{items.map(item => <li key={item.id}>
      {editing === item.id ? <form className="master-inline-edit" onSubmit={save}>
        <label>Nama kategori<input value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={100} required /></label>
        <label>Deskripsi<input value={description} onChange={e => setDescription(e.target.value)} maxLength={500} /></label>
        <div className="master-row-actions"><button className="post-document-button" disabled={busy}>Simpan</button><button type="button" className="text-button" onClick={() => setEditing(null)}>Batal</button></div>
      </form> : <><div className="master-item-copy"><strong>{item.name}</strong>{item.description && <span>{item.description}</span>}</div><div className="master-row-actions"><button className="text-button" onClick={() => start(item)} disabled={busy}>Edit</button><button className="text-button danger-text" onClick={() => remove(item.id)} disabled={busy}>Hapus</button></div></>}
    </li>)}</ul>
    {error && <p className="form-error">{error}</p>}
  </div>;
}
