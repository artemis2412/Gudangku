"use client";

import { useState, type FormEvent } from "react";

export function CreateOrganizationForm() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const result = await response.json() as { organization?: { id: string }; error?: string };
      if (!response.ok || !result.organization) throw new Error(result.error ?? "Organisasi gagal dibuat.");
      window.location.assign(`/dashboard/${result.organization.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="organization-form" onSubmit={submit}>
      <label htmlFor="organization-name">Nama organisasi</label>
      <input id="organization-name" required minLength={2} maxLength={100} value={name} onChange={e => setName(e.target.value)} placeholder="Contoh: Gudang Utama" />
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button" disabled={busy}>{busy ? "Membuat..." : "Buat organisasi"}</button>
    </form>
  );
}
