"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Email o contraseña incorrectos");
      setLoading(false);
    } else {
      router.refresh();
      router.push("/");
    }
  };

  return (
    <div className="login-page">
      <div className="login-container animate-in">
        {/* Hero */}
        <div className="hero">
          <div className="trophy-icon">🏆</div>
          <h1>Porra Mundial</h1>
          <div className="year-badge">FIFA 2026</div>
          <p className="subtitle">USA · México · Canadá</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="login-form card">
          <div className="input-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nombre@porra.com"
              required
              autoComplete="email"
            />
          </div>
          <div className="input-group">
            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-toast">
              <span>⚠️</span> {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? (
              <div className="btn-loading">
                <div className="spinner-sm" />
                Entrando...
              </div>
            ) : (
              "Entrar al torneo"
            )}
          </button>
        </form>

        <div className="motto animate-in stagger-2">
          <p className="motto-text">"Amistades en pausa, memes despiadados y una cuenta que pagar. El ganador se lleva la gloria... y la factura del último."</p>
          <p className="motto-sub">Mundial 2026: ¿Quién invitará a quién?</p>
        </div>
      </div>

      <style jsx>{`
        .motto {
          margin-top: 1.5rem;
          text-align: center;
          padding: 0 1rem;
        }
        .motto-text {
          font-size: 0.9rem;
          font-weight: 700;
          font-style: italic;
          background: linear-gradient(135deg, var(--gold), #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1.4;
          margin-bottom: 0.4rem;
        }
        .motto-sub {
          font-size: 0.7rem;
          text-transform: uppercase;
          letter-spacing: 0.15em;
          color: var(--text-dim);
          font-weight: 800;
        }
        .login-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem 0;
        }
        .login-container {
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
        }
        .hero {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .trophy-icon {
          font-size: 3.5rem;
          margin-bottom: 0.5rem;
          filter: drop-shadow(0 4px 12px rgba(251, 191, 36, 0.3));
        }
        .hero h1 {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          margin-bottom: 0;
          background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .year-badge {
          background: linear-gradient(135deg, var(--green), #00e676);
          color: #000;
          padding: 4px 16px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }
        .subtitle {
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 400;
          margin-top: 0.25rem;
        }

        .login-form {
          width: 100%;
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        label {
          font-size: 0.8rem;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        input {
          background: var(--bg-input);
          border: 1px solid var(--border);
          padding: 0.85rem 1rem;
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }
        input::placeholder {
          color: var(--text-dim);
        }
        input:focus {
          outline: none;
          border-color: var(--green);
          box-shadow: 0 0 0 3px var(--green-glow);
        }

        .error-toast {
          background: var(--red-dim);
          color: #fca5a5;
          padding: 0.6rem 0.8rem;
          border-radius: var(--radius-sm);
          font-size: 0.82rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          border: 1px solid rgba(239, 68, 68, 0.15);
        }

        .login-btn {
          background: linear-gradient(135deg, var(--green), #00e676);
          color: #000;
          padding: 0.9rem;
          border-radius: var(--radius-sm);
          font-weight: 700;
          font-size: 1rem;
          letter-spacing: 0.01em;
          margin-top: 0.5rem;
          transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(0, 200, 83, 0.25);
        }
        .login-btn:hover {
          box-shadow: 0 6px 24px rgba(0, 200, 83, 0.35);
          transform: translateY(-1px);
        }
        .login-btn:active {
          transform: translateY(0);
        }
        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .btn-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .spinner-sm {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(0,0,0,0.2);
          border-top-color: #000;
          border-radius: 50%;
          animation: spin 0.6s linear infinite;
        }


        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
