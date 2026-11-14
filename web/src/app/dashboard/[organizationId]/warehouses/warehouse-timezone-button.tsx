"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function WarehouseTimezoneButton({ organizationId, warehouseId, currentTimeZone }: { organizationId: string; warehouseId: string; currentTimeZone: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  async function update() {
    setBusy(true); setMessage("");
    try {
      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Jakarta";
      if (timeZone === currentTimeZone) { setMessage("Sudah sesuai perangkat."); return; }
      const response = await fetch(`/api/organizations/${organizationId}/warehouses/${warehouseId}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ timeZone }),
      });
      const result = await response.json();
      if (!response.ok) { setMessage(result.error || "Gagal memperbarui zona waktu."); return; }
      setMessage(`Diperbarui ke ${timeZone}.`); router.refresh();
    } catch { setMessage("Koneksi bermasalah. Coba lagi."); }
    finally { setBusy(false); }
  }
  return <div className="warehouse-timezone-action"><button type="button" className="text-button" onClick={update} disabled={busy}>{busy ? "Memperbarui..." : "Sesuaikan dengan perangkat ini"}</button>{message && <small role="status">{message}</small>}</div>;
}
