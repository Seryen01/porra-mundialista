"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { getFlagUrl, getCode } from "@/lib/flags";
import { Plus, Check, Zap } from "lucide-react";

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [teamA, setTeamA] = useState("");
  const [teamB, setTeamB] = useState("");
  const [date, setDate] = useState("");
  const [phase, setPhase] = useState("Fase de Grupos");

  useEffect(() => {
    if (session && (session.user as any).role !== "ADMIN") {
      router.push("/");
    } else if (session) {
      fetchMatches();
    }
  }, [session]);

  const fetchMatches = async () => {
    const res = await fetch("/api/matches");
    const data = await res.json();
    setMatches(data);
    setLoading(false);
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/matches", {
      method: "POST",
      body: JSON.stringify({ teamA, teamB, date, phase }),
    });
    fetchMatches();
    setTeamA("");
    setTeamB("");
    setDate("");
    setShowForm(false);
  };

  const handleUpdateResult = async (id: string, scoreA: string, scoreB: string, status: string) => {
    await fetch(`/api/matches/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ scoreA, scoreB, status }),
    });
    fetchMatches();
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Cargando panel...</span>
      </div>
    );
  }

  return (
    <div className="admin animate-in">
      <header className="admin-header">
        <h1>⚙️ Admin</h1>
        <button className="toggle-form-btn" onClick={() => setShowForm(!showForm)}>
          <Plus size={18} />
          Nuevo
        </button>
      </header>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreateMatch} className="card create-form animate-in">
          <h3>Crear Partido</h3>
          <div className="form-grid">
            <input placeholder="Equipo A" value={teamA} onChange={e => setTeamA(e.target.value)} required />
            <input placeholder="Equipo B" value={teamB} onChange={e => setTeamB(e.target.value)} required />
            <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required />
            <select value={phase} onChange={e => setPhase(e.target.value)}>
              <option>Fase de Grupos</option>
              <option>Octavos</option>
              <option>Cuartos</option>
              <option>Semis</option>
              <option>Final</option>
            </select>
          </div>
          <button type="submit" className="submit-btn">
            <Check size={16} />
            Crear Partido
          </button>
        </form>
      )}

      {/* Matches admin list */}
      <div className="admin-matches">
        {matches.map(match => (
          <AdminMatchCard key={match.id} match={match} onUpdate={handleUpdateResult} />
        ))}
      </div>

      <style jsx>{`
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .admin-header h1 {
          font-size: 1.6rem;
          font-weight: 800;
          margin-bottom: 0;
        }
        .toggle-form-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: linear-gradient(135deg, var(--green), #00e676);
          color: #000;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          font-weight: 700;
          font-size: 0.8rem;
        }

        .create-form {
          padding: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .create-form h3 {
          font-size: 1rem;
          margin-bottom: 1rem;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.75rem;
          margin-bottom: 1rem;
        }
        .form-grid input, .form-grid select {
          background: var(--bg-input);
          border: 1px solid var(--border);
          padding: 0.7rem 0.8rem;
          color: var(--text-primary);
          border-radius: var(--radius-sm);
          font-size: 0.85rem;
        }
        .form-grid input:focus, .form-grid select:focus {
          outline: none;
          border-color: var(--green);
        }
        .submit-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          background: linear-gradient(135deg, var(--green), #00e676);
          color: #000;
          padding: 0.7rem;
          border-radius: var(--radius-sm);
          font-weight: 700;
          font-size: 0.85rem;
        }
        .admin-matches {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
      `}</style>
    </div>
  );
}

function AdminMatchCard({ match, onUpdate }: { match: any; onUpdate: (id: string, sA: string, sB: string, status: string) => void }) {
  const [sA, setSA] = useState(match.scoreA?.toString() ?? "");
  const [sB, setSB] = useState(match.scoreB?.toString() ?? "");

  return (
    <div className="admin-card card">
      <div className="ac-top">
        <span className="ac-phase">{match.phase}</span>
        <span className={`ac-status ${match.status.toLowerCase()}`}>{match.status}</span>
      </div>
      <div className="ac-teams">
        <img src={getFlagUrl(match.teamA)} alt={match.teamA} className="ac-flag-img" />
        <span className="ac-name">{getCode(match.teamA)}</span>
        <input type="number" value={sA} onChange={e => setSA(e.target.value)} placeholder="0" className="ac-input" />
        <span className="ac-vs">–</span>
        <input type="number" value={sB} onChange={e => setSB(e.target.value)} placeholder="0" className="ac-input" />
        <span className="ac-name">{getCode(match.teamB)}</span>
        <img src={getFlagUrl(match.teamB)} alt={match.teamB} className="ac-flag-img" />
      </div>
      <div className="ac-actions">
        <button className="ac-btn live" onClick={() => onUpdate(match.id, sA, sB, "LIVE")}>
          <Zap size={13} /> LIVE
        </button>
        <button className="ac-btn finish" onClick={() => onUpdate(match.id, sA, sB, "FINISHED")}>
          <Check size={13} /> Finalizar
        </button>
      </div>

      <style jsx>{`
        .admin-card { padding: 0; overflow: hidden; }
        .ac-top {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0.8rem;
          background: rgba(0,0,0,0.2);
          border-bottom: 1px solid var(--border);
        }
        .ac-phase {
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-dim);
        }
        .ac-status {
          font-size: 0.6rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          padding: 1px 6px;
          border-radius: 4px;
        }
        .ac-status.upcoming { color: var(--text-muted); background: rgba(255,255,255,0.05); }
        .ac-status.live { color: #fbbf24; background: rgba(251, 191, 36, 0.15); }
        .ac-status.finished { color: var(--green); background: var(--green-glow); }
        .ac-teams {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.8rem;
          gap: 0.5rem;
        }
        .ac-flag-img { width: 28px; height: 18px; object-fit: cover; border-radius: 3px; box-shadow: 0 1px 4px rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); }
        .ac-name { font-weight: 700; font-size: 0.75rem; color: var(--text-secondary); min-width: 28px; }
        .ac-input {
          width: 36px;
          height: 36px;
          background: var(--bg-input);
          border: 1px solid var(--border);
          border-radius: 6px;
          color: var(--text-primary);
          text-align: center;
          font-size: 1rem;
          font-weight: 800;
          font-family: inherit;
        }
        .ac-input:focus { outline: none; border-color: var(--green); }
        .ac-vs { color: var(--text-dim); font-weight: 700; }
        .ac-actions {
          display: flex;
          gap: 0.5rem;
          padding: 0 0.8rem 0.6rem;
        }
        .ac-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.3rem;
          padding: 0.45rem;
          border-radius: 6px;
          font-weight: 700;
          font-size: 0.72rem;
          transition: all 0.2s;
        }
        .ac-btn.live {
          background: rgba(251, 191, 36, 0.1);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.2);
        }
        .ac-btn.finish {
          background: var(--green-glow);
          color: var(--green);
          border: 1px solid rgba(0, 200, 83, 0.2);
        }
        .ac-btn:hover { filter: brightness(1.15); }
      `}</style>
    </div>
  );
}
