import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CreateOrganizationForm } from "./organization-form";

type Membership = {
  id: string;
  role: string;
  organizations: { id: string; name: string } | null;
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const claims = claimsData?.claims;
  if (!claims?.sub) redirect("/login");

  const { data, error } = await supabase
    .from("organization_members")
    .select("id, role, organizations(id, name)")
    .eq("user_id", claims.sub)
    .order("created_at", { ascending: true });

  if (error) {
    return <main className="dashboard-shell"><p className="form-error">Tidak dapat memuat organisasi: {error.message}</p></main>;
  }

  const memberships = (data ?? []) as unknown as Membership[];

  return (
    <main className="dashboard-shell">
      <header className="dashboard-topbar">
        <Link href="/" className="brand"><span className="brand-mark">G</span><span>GUDANGKU</span></Link>
        <form action="/auth/signout" method="post"><button className="text-button">Keluar</button></form>
      </header>
      <section className="dashboard-heading">
        <p className="eyebrow">RUANG KERJA</p>
        <h1>Organisasi gudang</h1>
        <p className="auth-description">Pilih organisasi untuk melanjutkan. Data setiap organisasi terpisah dan dilindungi kebijakan akses.</p>
      </section>
      {memberships.length > 0 ? (
        <div className="organization-list">
          {memberships.map(member => member.organizations && (
            <article className="organization-card" key={member.id}>
              <div><h2>{member.organizations.name}</h2><p>Peran: <strong>{member.role}</strong></p></div>
              <Link className="primary-button" href={`/dashboard/${member.organizations.id}`}>Buka ruang kerja ↗</Link>
            </article>
          ))}
        </div>
      ) : (
        <section className="empty-organization">
          <h2>Belum ada organisasi</h2>
          <p>Buat organisasi pertama. Akun ini akan otomatis menjadi owner.</p>
          <CreateOrganizationForm />
        </section>
      )}
    </main>
  );
}
