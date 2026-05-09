"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getFlagUrl, getCode } from "@/lib/flags";
import { Lock, Check, Pencil } from "lucide-react";

interface Match {
  id: string;
  teamA: string;
  teamB: string;
  date: string;
  phase: string;
  scoreA: number | null;
  scoreB: number | null;
  status: string;
  predictions: any[];
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchMatches();
    }
  }, [status]);

  const fetchMatches = async () => {
    const res = await fetch("/api/matches");
    const data = await res.json();
    setMatches(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Cargando partidos...</span>
      </div>
    );
  }

  const groupedMatches = matches.reduce((acc: Record<string, Match[]>, match) => {
    const dateKey = format(new Date(match.date), "EEEE d 'de' MMMM", { locale: es });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(match);
    return acc;
  }, {});

  const totalPredictions = matches.filter(m => m.predictions.length > 0).length;

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dash-header animate-in">
        <div className="header-left">
          <h1>⚽ Partidos</h1>
          <span className="match-count">{matches.length} partidos</span>
        </div>
        <div className="header-right">
          <div className="user-chip">
            <span className="user-initial">{session?.user?.name?.[0]}</span>
            <div className="user-info">
              <span className="user-name">{session?.user?.name}</span>
              <span className="user-stat">{totalPredictions}/{matches.length} apostados</span>
            </div>
          </div>
        </div>
      </header>

      {/* Progress bar */}
      <div className="progress-bar animate-in stagger-1">
        <div className="progress-fill" style={{ width: `${(totalPredictions / Math.max(matches.length, 1)) * 100}%` }} />
      </div>

      {/* Matches */}
      {Object.keys(groupedMatches).length === 0 ? (
        <div className="empty-state card animate-in stagger-2">
          <span className="empty-icon">📅</span>
          <p>No hay partidos programados aún.</p>
        </div>
      ) : (
        Object.entries(groupedMatches).map(([date, dateMatches], groupIndex) => (
          <div key={date} className="date-group animate-in" style={{ animationDelay: `${0.1 + groupIndex * 0.05}s` }}>
            <div className="date-header">
              <div className="date-dot" />
              <h2 className="date-title">{date}</h2>
              <span className="date-count">{dateMatches.length} partidos</span>
            </div>
            <div className="matches-list">
              {dateMatches.map((match) => (
                <MatchCard key={match.id} match={match} onUpdate={fetchMatches} />
              ))}
            </div>
          </div>
        ))
      )}

      <style jsx>{`
        .dashboard {
          padding-top: 1.25rem;
        }
        .dash-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .header-left h1 {
          font-size: 1.6rem;
          font-weight: 800;
          margin-bottom: 0;
        }
        .match-count {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .user-chip {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          background: var(--bg-card);
          padding: 0.4rem 0.8rem 0.4rem 0.4rem;
          border-radius: 28px;
          border: 1px solid var(--border);
        }
        .user-initial {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--green), #00e676);
          color: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.85rem;
        }
        .user-info {
          display: flex;
          flex-direction: column;
        }
        .user-name {
          font-size: 0.8rem;
          font-weight: 600;
        }
        .user-stat {
          font-size: 0.65rem;
          color: var(--text-muted);
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: var(--bg-card);
          border-radius: 4px;
          margin-bottom: 1.5rem;
          overflow: hidden;
        }
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--green), #00e676);
          border-radius: 4px;
          transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .date-group {
          margin-bottom: 1.5rem;
        }
        .date-header {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 0.75rem;
        }
        .date-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--green);
          flex-shrink: 0;
        }
        .date-title {
          font-size: 0.85rem;
          text-transform: capitalize;
          color: var(--text-secondary);
          font-weight: 600;
          margin-bottom: 0;
          flex: 1;
        }
        .date-count {
          font-size: 0.7rem;
          color: var(--text-dim);
          background: var(--bg-card);
          padding: 2px 8px;
          border-radius: 10px;
        }
        .matches-list {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .empty-state {
          padding: 3rem;
          text-align: center;
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.75rem;
        }
        .empty-icon {
          font-size: 2.5rem;
        }
      `}</style>
    </div>
  );
}

function MatchCard({ match, onUpdate }: { match: Match; onUpdate: () => void }) {
  const prediction = match.predictions[0];
  const [scoreA, setScoreA] = useState(prediction?.predictedScoreA ?? "");
  const [scoreB, setScoreB] = useState(prediction?.predictedScoreB ?? "");
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(!prediction);
  const [error, setError] = useState<string | null>(null);

  const isLocked = match.status !== "UPCOMING" || new Date(match.date) < new Date();
  const hasPrediction = !!prediction;

  const handleSave = async () => {
    if (scoreA === "" || scoreB === "") return;
    setSaving(true);
    setError(null);

    const res = await fetch("/api/predictions", {
      method: "POST",
      body: JSON.stringify({ matchId: match.id, scoreA, scoreB }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Error al guardar el pronóstico");
      setSaving(false);
      return;
    }

    setSaving(false);
    setIsEditing(false);
    onUpdate();
  };

  const hasChanges = prediction?.predictedScoreA !== parseInt(scoreA as any) || prediction?.predictedScoreB !== parseInt(scoreB as any);
  const inputsDisabled = isLocked || saving || (!isEditing && hasPrediction && !hasChanges);

  return (
    <div className={`match-card card ${isLocked ? 'is-locked' : ''} ${hasPrediction && !isEditing && !hasChanges ? 'is-saved' : ''}`}>
      {/* Top bar: phase + time */}
      <div className="mc-top">
        <span className="mc-phase">{match.phase}</span>
        <span className="mc-time">{format(new Date(match.date), "HH:mm")}</span>
      </div>

      {/* Teams row */}
      <div className="mc-teams">
        <div className="mc-team mc-team-left">
          <img src={getFlagUrl(match.teamA)} alt={match.teamA} className="mc-flag-img" />
          <div className="mc-team-info">
            <span className="mc-team-name">{match.teamA}</span>
            <span className="mc-team-code">{getCode(match.teamA)}</span>
          </div>
        </div>

        {/* Score inputs */}
        <div className="mc-score-area">
          <input
            type="number"
            min="0"
            max="99"
            value={scoreA}
            onChange={(e) => setScoreA(e.target.value)}
            disabled={inputsDisabled}
            placeholder="–"
            className={`mc-input ${hasPrediction && !isEditing ? 'filled' : ''}`}
          />
          <span className="mc-vs">:</span>
          <input
            type="number"
            min="0"
            max="99"
            value={scoreB}
            onChange={(e) => setScoreB(e.target.value)}
            disabled={inputsDisabled}
            placeholder="–"
            className={`mc-input ${hasPrediction && !isEditing ? 'filled' : ''}`}
          />
        </div>

        <div className="mc-team mc-team-right">
          <div className="mc-team-info right">
            <span className="mc-team-name">{match.teamB}</span>
            <span className="mc-team-code">{getCode(match.teamB)}</span>
          </div>
          <img src={getFlagUrl(match.teamB)} alt={match.teamB} className="mc-flag-img" />
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mc-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Actions */}
      {!isLocked && (
        <div className="mc-actions">
          {(!hasPrediction || isEditing || hasChanges) ? (
            <button className="mc-btn mc-btn-save" onClick={handleSave} disabled={saving || scoreA === "" || scoreB === ""}>
              {saving ? "Guardando..." : (hasPrediction ? "Guardar cambios" : "Guardar pronóstico")}
            </button>
          ) : (
            <button className="mc-btn mc-btn-edit" onClick={() => setIsEditing(true)}>
              <Pencil size={14} />
              Modificar
            </button>
          )}
        </div>
      )}

      {/* Locked state */}
      {isLocked && (
        <div className="mc-locked-bar">
          {match.status === "FINISHED" ? (
            <div className="mc-final">
              <div className="mc-final-score">
                <span>Resultado: <strong>{match.scoreA} – {match.scoreB}</strong></span>
              </div>
              <div className={`mc-points-badge ${(prediction?.points || 0) > 0 ? 'win' : ''} ${(prediction?.points || 0) >= 5 ? 'exact' : ''}`}>
                +{prediction?.points || 0} pts
              </div>
            </div>
          ) : hasPrediction ? (
            <div className="mc-locked-info">
              <Lock size={12} />
              <span>Tu apuesta: {prediction.predictedScoreA} – {prediction.predictedScoreB}</span>
            </div>
          ) : (
            <div className="mc-locked-info missed">
              <Lock size={12} />
              <span>No apostaste</span>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .match-card {
          padding: 0;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .match-card.is-saved {
          border-color: rgba(0, 200, 83, 0.15);
        }
        .match-card.is-locked {
          opacity: 0.85;
        }

        .mc-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.6rem 1rem;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid var(--border);
        }
        .mc-phase {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
        }
        .mc-time {
          font-size: 0.7rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: rgba(255,255,255,0.05);
          padding: 2px 8px;
          border-radius: 4px;
        }

        .mc-teams {
          display: flex;
          align-items: center;
          padding: 1rem;
          gap: 0.5rem;
        }
        .mc-team {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          min-width: 0;
        }
        .mc-team-right {
          justify-content: flex-end;
        }
        .mc-flag-img {
          width: 36px;
          height: 24px;
          object-fit: cover;
          border-radius: 4px;
          flex-shrink: 0;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .mc-team-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .mc-team-info.right {
          align-items: flex-end;
        }
        .mc-team-name {
          font-weight: 700;
          font-size: 0.85rem;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .mc-team-code {
          font-size: 0.65rem;
          color: var(--text-dim);
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .mc-score-area {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex-shrink: 0;
        }
        .mc-input {
          width: 42px;
          height: 42px;
          background: var(--bg-input);
          border: 1.5px solid var(--border);
          border-radius: 10px;
          color: var(--text-primary);
          text-align: center;
          font-size: 1.15rem;
          font-weight: 800;
          transition: all 0.2s;
          font-family: inherit;
        }
        .mc-input::placeholder {
          color: var(--text-dim);
          font-weight: 400;
        }
        .mc-input:focus {
          outline: none;
          border-color: var(--green);
          box-shadow: 0 0 0 3px var(--green-glow);
        }
        .mc-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .mc-input.filled {
          background: var(--green-glow);
          border-color: rgba(0, 200, 83, 0.3);
          color: var(--green);
        }
        .mc-vs {
          color: var(--text-dim);
          font-weight: 800;
          font-size: 1rem;
        }

        .mc-error {
          background: var(--red-dim);
          color: #fca5a5;
          padding: 0.5rem 1rem;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          border-top: 1px solid rgba(239, 68, 68, 0.1);
        }

        .mc-actions {
          padding: 0 1rem 0.8rem;
        }
        .mc-btn {
          width: 100%;
          padding: 0.55rem;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          transition: all 0.2s;
        }
        .mc-btn-save {
          background: linear-gradient(135deg, var(--green), #00e676);
          color: #000;
        }
        .mc-btn-save:hover {
          box-shadow: 0 4px 16px rgba(0, 200, 83, 0.3);
        }
        .mc-btn-save:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }
        .mc-btn-edit {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          border: 1px solid var(--border);
        }
        .mc-btn-edit:hover {
          background: rgba(255, 255, 255, 0.08);
          color: var(--text-primary);
        }

        .mc-locked-bar {
          padding: 0.6rem 1rem;
          background: rgba(0, 0, 0, 0.15);
          border-top: 1px solid var(--border);
        }
        .mc-final {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .mc-final-score {
          font-size: 0.82rem;
          color: var(--text-secondary);
        }
        .mc-final-score strong {
          color: var(--text-primary);
        }
        .mc-points-badge {
          font-size: 0.72rem;
          font-weight: 800;
          padding: 3px 10px;
          border-radius: 6px;
          background: var(--bg-input);
          color: var(--text-dim);
        }
        .mc-points-badge.win {
          background: rgba(0, 200, 83, 0.15);
          color: var(--green);
        }
        .mc-points-badge.exact {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.1));
          color: var(--gold);
          box-shadow: 0 0 12px rgba(251, 191, 36, 0.15);
        }

        .mc-locked-info {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: var(--text-dim);
        }
        .mc-locked-info.missed {
          color: var(--text-dim);
          opacity: 0.6;
        }
      `}</style>
    </div>
  );
}
