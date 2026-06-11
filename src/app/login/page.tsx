"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { TOURNAMENT_START } from "@/lib/config";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [countdown, setCountdown] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const TARGET = TOURNAMENT_START.getTime();
    function tick() {
      const diff = TARGET - Date.now();
      if (diff <= 0) { setStarted(true); setCountdown(null); return; }
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

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

        {/* Countdown */}
        {(countdown || started) && (
          <div className="countdown animate-in stagger-1">
            {started ? (
              <p className="cd-started">¡El Mundial ha comenzado! 🎉</p>
            ) : (
              <>
                <p className="cd-label">⚽ El Mundial comienza en</p>
                <div className="cd-units">
                  <div className="cd-unit">
                    <span className="cd-num">{String(countdown!.days).padStart(2, "0")}</span>
                    <span className="cd-txt">días</span>
                  </div>
                  <span className="cd-sep">:</span>
                  <div className="cd-unit">
                    <span className="cd-num">{String(countdown!.hours).padStart(2, "0")}</span>
                    <span className="cd-txt">horas</span>
                  </div>
                  <span className="cd-sep">:</span>
                  <div className="cd-unit">
                    <span className="cd-num">{String(countdown!.minutes).padStart(2, "0")}</span>
                    <span className="cd-txt">min</span>
                  </div>
                  <span className="cd-sep">:</span>
                  <div className="cd-unit">
                    <span className="cd-num">{String(countdown!.seconds).padStart(2, "0")}</span>
                    <span className="cd-txt">seg</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

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
          <p className="motto-text">"Bienvenidos a la porra del Mundial 2026 donde hay dos tipos de personas: los que cenan gratis y los que financian la fiesta."</p>
          <p className="motto-sub">Decide en qué bando quieres estar.</p>
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

        .countdown {
          text-align: center;
          width: 100%;
        }
        .cd-label {
          font-size: 0.65rem;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: var(--text-dim);
          margin-bottom: 0.75rem;
          font-weight: 700;
        }
        .cd-units {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
        }
        .cd-unit {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 10px;
          padding: 0.75rem 1.1rem;
          min-width: 72px;
        }
        .cd-num {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.03em;
          background: linear-gradient(135deg, #ffffff 0%, var(--gold) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
        }
        .cd-txt {
          font-size: 0.58rem;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-dim);
          margin-top: 0.35rem;
          font-weight: 700;
        }
        .cd-sep {
          font-size: 1.4rem;
          font-weight: 800;
          color: rgba(255, 255, 255, 0.2);
          margin-bottom: 1.1rem;
        }
        .cd-started {
          font-size: 1rem;
          font-weight: 700;
          color: var(--gold);
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
