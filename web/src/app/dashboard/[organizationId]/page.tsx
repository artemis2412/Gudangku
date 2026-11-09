import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OrganizationWorkspace({ params }: { params: Promise<{ organizationId: string }> }) {
  const { organizationId } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role, organizations(id, name)")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!membership?.organizations) notFound();

  const organization = membership.organizations as unknown as { id: string; name: string };

  return (
    <main className="dashboard-shell">
      <header className="dashboard-topbar">
        <Link href="/" className="brand"><span className="brand-mark">G</span><span>GUDANGKU</span></Link>
        <div className="topbar-actions"><Link href="/dashboard" className="text-button">Semua organisasi</Link><form action="/auth/signout" method="post"><button className="text-button">Keluar</button></form></div>
      </header>
      <section className="dashboard-heading">
        <p className="eyebrow">RUANG KERJA ORGANISASI</p>
        <h1>{organization.name}</h1>
        <p className="auth-description">Peran akun: <strong>{membership.role}</strong>. Ruang kerja organisasi berhasil dimuat.</p>
      </section>
      <section className="workspace-panel">
        <h2>Ruang kerja siap disiapkan</h2>
        <p>Keanggotaan dan akses organisasi sudah diperiksa. Berikutnya kita bangun ringkasan stok, daftar produk, gudang, dan transaksi persediaan.</p>
        <Link className="primary-button" href="/dashboard">Kembali ke organisasi</Link>
      </section>
    </main>
  );
}
