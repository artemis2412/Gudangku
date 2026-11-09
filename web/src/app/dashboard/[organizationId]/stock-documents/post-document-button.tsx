"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function PostDocumentButton({ organizationId, documentId }: { organizationId: string; documentId: string }) {
  const router = useRouter(); const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function post() {
    if (!window.confirm("Posting transaksi ini? Stok akan diperbarui dan dokumen tidak dapat diedit lagi.")) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/organizations/${organizationId}/stock-documents/${documentId}/post`, { method: "POST" });
      const result = await response.json();
      if (!response.ok) { setError(result.error || "Posting gagal."); return; }
      router.refresh();
    } catch { setError("Koneksi bermasalah. Coba lagi."); }
    finally { setBusy(false); }
  }
  return <div className="post-action"><button type="button" className="post-document-button" onClick={post} disabled={busy}>{busy ? "Memproses..." : "Posting"}</button>{error && <small className="inline-error">{error}</small>}</div>;
}
