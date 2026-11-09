"use client";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export function CategoryForm({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const response = await fetch(`/api/organizations/${organizationId}/categories`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, description }) });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Kategori gagal disimpan."); return; }
      setName(""); setDescription(""); router.refresh();
    } catch { setError("Koneksi bermasalah. Coba lagi."); }
    finally { setBusy(false); }
  }
  return <form className="master-form" onSubmit={submit}>
    <label htmlFor="category-name">Nama kategori</label><input id="category-name" value={name} onChange={e => setName(e.target.value)} minLength={2} maxLength={100} placeholder="Contoh: Minuman" required />
    <label htmlFor="category-description">Deskripsi (opsional)</label><textarea id="category-description" rows={2} value={description} onChange={e => setDescription(e.target.value)} maxLength={500} />
    {error && <p className="form-error">{error}</p>}<button className="primary-button auth-submit" disabled={busy}>{busy ? "Menyimpan..." : "Simpan kategori"}</button>
  </form>;
}
