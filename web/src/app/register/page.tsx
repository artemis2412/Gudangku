import Link from "next/link";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <Link href="/" className="auth-brand"><span className="brand-mark">G</span> GUDANGKU</Link>
        <p className="eyebrow">MULAI GUNAKAN GUDANGKU</p>
        <h1>Buat akun baru.</h1>
        <p className="auth-description">Daftarkan akun pemilik. Setelah email dikonfirmasi, kamu dapat membuat organisasi gudang.</p>
        <RegisterForm />
        <p className="auth-switch">Sudah punya akun? <Link href="/login">Masuk</Link></p>
      </section>
    </main>
  );
}
