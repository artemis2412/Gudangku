import Link from "next/link";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link href="/" className="auth-brand"><span className="brand-mark">G</span> GUDANGKU</Link>
        <p className="eyebrow">SELAMAT DATANG KEMBALI</p>
        <h1>Masuk ke ruang kerjamu.</h1>
        <p className="auth-description">Gunakan akun GUDANGKU untuk melanjutkan pengelolaan persediaan.</p>
        <LoginForm />
        <p className="auth-switch">Belum punya akun? <Link href="/register">Daftar di sini</Link></p>
      </section>
    </main>
  );
}
