"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getFlagUrl, getCode } from "@/lib/flags";
import { Lock, Check, Pencil, ChevronDown, ChevronUp } from "lucide-react";

interface Match {
  id: string;
  teamA: string;
  teamB: string;
  date: string;
  phase: string;
  scoreA: number | null;
  scoreB: number | null;
  status: string;
  isStarMatch: boolean;
  predictions: any[];
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedDates, setExpandedDates] = useState<Record<string, boolean>>({});

  const toggleDate = (date: string) => {
    setExpandedDates(prev => ({
      ...prev,
      [date]: !prev[date]
    }));
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchMatches();
      fetch("/api/profile")
        .then(res => res.json())
        .then(data => setUserData(data));
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

  const allGroupedMatches = matches.reduce((acc: Record<string, Match[]>, match) => {
    const dateKey = format(new Date(match.date), "EEEE d 'de' MMMM", { locale: es });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(match);
    return acc;
  }, {});

  // Only show days that have at least one non-finished match
  const groupedMatches = Object.fromEntries(
    Object.entries(allGroupedMatches).filter(([, dayMatches]) =>
      dayMatches.some(m => m.status !== "FINISHED")
    )
  );

  const pendingMatches = Object.values(groupedMatches).flat();
  const totalPredictions = pendingMatches.filter(m => m.predictions.length > 0).length;

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dash-header animate-in">
        <div className="header-left">
          <h1>⚽ Partidos</h1>
          <span className="match-count">{pendingMatches.length} partidos pendientes</span>
        </div>
        <div className="header-right">
          <div className="user-chip">
            <div 
              className="user-avatar-wrap" 
              onClick={() => userData?.image && setShowModal(true)}
              style={{ cursor: userData?.image ? 'pointer' : 'default' }}
            >
              {userData?.image ? (
                <img src={userData.image} alt="" className="user-avatar-img" />
              ) : (
                <span className="user-initial" onClick={() => router.push('/profile')} style={{ cursor: 'pointer' }}>{session?.user?.name?.[0]}</span>
              )}
            </div>
            <div className="user-info" onClick={() => router.push('/profile')} style={{ cursor: 'pointer' }}>
              <span className="user-name">{session?.user?.name}</span>
              <span className="user-stat">{totalPredictions}/{pendingMatches.length} apostados</span>
            </div>
          </div>
        </div>
      </header>

      {/* Image Modal */}
      {showModal && userData?.image && (
        <div className="image-modal" onClick={() => setShowModal(false)}>
          <div className="modal-content animate-in">
            <img src={userData.image} alt="Avatar" />
            <button className="close-modal">Cerrar</button>
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="progress-bar animate-in stagger-1">
        <div className="progress-fill" style={{ width: `${(totalPredictions / Math.max(pendingMatches.length, 1)) * 100}%` }} />
      </div>

      <BonusSection />

      {/* Matches */}
      {Object.keys(groupedMatches).length === 0 ? (
        <div className="empty-state card animate-in stagger-2">
          <span className="empty-icon">📅</span>
          <p>No hay partidos programados aún.</p>
        </div>
      ) : (
        Object.entries(groupedMatches).map(([date, dateMatches], groupIndex) => {
          const uniquePhases = Array.from(new Set(dateMatches.map(m => m.phase)));
          const hasGroups = uniquePhases.some(p => p && p.toLowerCase().includes("grupo"));
          const hasKnockout = uniquePhases.some(p => p && !p.toLowerCase().includes("grupo"));
          const phase = hasGroups && hasKnockout
            ? "Fase de Grupos & Dieciseisavos"
            : hasGroups
            ? "Fase de Grupos"
            : uniquePhases.join(" & ");
          const hasStarMatch = dateMatches.some(m => m.isStarMatch);
          return (
            <div key={date} className="date-group animate-in" style={{ animationDelay: `${0.1 + groupIndex * 0.05}s` }}>
              <div
                className="date-header"
                onClick={() => toggleDate(date)}
                style={{ cursor: 'pointer', userSelect: 'none' }}
              >
                <div className={`date-dot${hasStarMatch ? ' star-dot' : ''}`} />
                <div className="date-title-wrap">
                  <span className="phase-pill">{phase}</span>
                  <h2 className="date-title">{date}</h2>
                </div>
                <span className="date-count">{dateMatches.length} partidos</span>
                <div className="date-chevron">
                  {expandedDates[date] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>
              {expandedDates[date] && (
                <div className="matches-list animate-in">
                  {dateMatches.map((match) => (
                    <MatchCard key={match.id} match={match} onUpdate={fetchMatches} />
                  ))}
                </div>
              )}
            </div>
          );
        })
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
        .user-avatar-wrap {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--green), #00e676);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          flex-shrink: 0;
        }
        .user-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .user-initial {
          color: #000;
          font-weight: 800;
          font-size: 0.85rem;
        }

        /* Image Modal */
        .image-modal {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          z-index: 2000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          backdrop-filter: blur(10px);
        }
        .modal-content {
          position: relative;
          max-width: 100%;
          max-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }
        .modal-content img {
          max-width: 100%;
          max-height: 80vh;
          border-radius: 20px;
          box-shadow: 0 0 40px rgba(0,0,0,0.5);
          border: 2px solid rgba(255,255,255,0.1);
        }
        .close-modal {
          background: var(--bg-card);
          color: var(--text-primary);
          border: 1px solid var(--border);
          padding: 0.6rem 2rem;
          border-radius: 30px;
          font-weight: 700;
          font-size: 0.9rem;
          cursor: pointer;
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
          padding: 0.5rem;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .date-header:hover {
          background: rgba(255, 255, 255, 0.05);
        }
        .date-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--green);
          flex-shrink: 0;
        }
        .date-dot.star-dot {
          background: var(--gold);
          box-shadow: 0 0 6px rgba(251, 191, 36, 0.5);
        }
        .date-title-wrap {
          display: flex;
          flex-direction: column;
          flex: 1;
        }
        .phase-pill {
          font-size: 0.6rem;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--gold);
          margin-bottom: 2px;
        }
        .date-title {
          font-size: 0.85rem;
          text-transform: capitalize;
          color: var(--text-secondary);
          font-weight: 600;
          margin-bottom: 0;
        }
        .date-count {
          font-size: 0.7rem;
          color: var(--text-dim);
          background: var(--bg-card);
          padding: 2px 8px;
          border-radius: 10px;
        }
        .date-chevron {
          color: var(--text-dim);
          display: flex;
          align-items: center;
          justify-content: center;
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
    <div className={`match-card card ${isLocked ? 'is-locked' : ''} ${hasPrediction && !isEditing && !hasChanges ? 'is-saved' : ''} ${match.isStarMatch ? 'is-star' : ''}`}>
      {/* Top bar: phase + time */}
      <div className="mc-top">
        <span className="mc-phase">{match.phase}</span>
        <div className="mc-top-right">
          {match.isStarMatch && (
            <span className="star-badge" title="Puntos dobles en este partido">⭐ Partido Estrella</span>
          )}
          <span className="mc-time">{format(new Date(match.date), "HH:mm")}</span>
        </div>
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
        <div className="mc-score-wrap">
          <div className="mc-score-area">
            <input
              type="number"
              min="0"
              max="99"
              value={scoreA}
              onChange={(e) => setScoreA(e.target.value)}
              disabled={inputsDisabled}
              placeholder="–"
              className={`mc-input ${hasPrediction && !isEditing ? 'filled' : ''} ${match.isStarMatch ? 'star-input' : ''}`}
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
              className={`mc-input ${hasPrediction && !isEditing ? 'filled' : ''} ${match.isStarMatch ? 'star-input' : ''}`}
            />
          </div>
          {match.isStarMatch && <span className="mc-x2">⭐ ×2 puntos</span>}
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
        .match-card.is-star {
          border-color: rgba(251, 191, 36, 0.45);
          box-shadow: 0 0 0 1px rgba(251, 191, 36, 0.12), 0 4px 24px rgba(251, 191, 36, 0.12);
        }

        .mc-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.6rem 1rem;
          background: rgba(0, 0, 0, 0.2);
          border-bottom: 1px solid var(--border);
        }
        .match-card.is-star .mc-top {
          background: linear-gradient(90deg, rgba(251, 191, 36, 0.12), rgba(0, 0, 0, 0.15));
          border-bottom-color: rgba(251, 191, 36, 0.25);
        }
        .mc-phase {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
        }
        .mc-top-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .star-badge {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.25), rgba(251, 191, 36, 0.12));
          color: var(--gold);
          font-size: 0.65rem;
          font-weight: 800;
          padding: 3px 8px;
          border-radius: 5px;
          border: 1px solid rgba(251, 191, 36, 0.4);
          text-transform: uppercase;
          letter-spacing: 0.04em;
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

        .mc-score-wrap {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.25rem;
          flex-shrink: 0;
        }
        .mc-score-area {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .mc-x2 {
          font-size: 0.6rem;
          font-weight: 800;
          color: var(--gold);
          background: rgba(251, 191, 36, 0.15);
          border: 1px solid rgba(251, 191, 36, 0.3);
          padding: 1px 7px;
          border-radius: 20px;
          letter-spacing: 0.04em;
          white-space: nowrap;
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
        .mc-input.star-input:focus {
          border-color: var(--gold);
          box-shadow: 0 0 0 3px rgba(251, 191, 36, 0.15);
        }
        .mc-input.star-input.filled {
          background: rgba(251, 191, 36, 0.08);
          border-color: rgba(251, 191, 36, 0.35);
          color: var(--gold);
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

function BonusSection() {
  const [bonus, setBonus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [topScorer, setTopScorer] = useState("");
  const [champion, setChampion] = useState("");
  const [spainResult, setSpainResult] = useState("");
  const [mvp, setMvp] = useState("");
  const [saving, setSaving] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetchBonus();
    const tournamentStart = new Date("2026-06-11T20:00:00Z");
    setIsLocked(new Date() >= tournamentStart);
  }, []);

  const fetchBonus = async () => {
    const res = await fetch("/api/bonus");
    if (res.ok) {
      const data = await res.json();
      if (data.userId) {
        setBonus(data);
        setTopScorer(data.topScorer || "");
        setChampion(data.champion || "");
        setSpainResult(data.spainResult || "");
        setMvp(data.mvp || "");
        setCollapsed(true);
      }
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/bonus", {
      method: "POST",
      body: JSON.stringify({ topScorer, champion, spainResult, mvp }),
    });
    setSaving(false);
    await fetchBonus();
    setCollapsed(true);
  };

  if (loading) return null;

  const hasPredictions = topScorer || champion || spainResult || mvp;

  return (
    <div className="bonus-section card animate-in stagger-2">
      {/* Header — always visible */}
      <div className="bonus-header" onClick={() => setCollapsed(c => !c)} style={{ cursor: "pointer" }}>
        <h2>🏆 Predicciones Bonus</h2>
        <div className="bonus-header-right">
          {isLocked && <span className="locked-badge"><Lock size={12} /> Bloqueado</span>}
          {collapsed ? <ChevronDown size={16} className="chevron" /> : <ChevronUp size={16} className="chevron" />}
        </div>
      </div>

      {/* Collapsed summary */}
      {collapsed && (
        <div className="bonus-summary">
          <div className="bs-pills">
            <div className="bs-pill">
              <span className="bs-label">Goleador</span>
              <span className="bs-val">{topScorer || <em>—</em>}</span>
            </div>
            <div className="bs-pill">
              <span className="bs-label">Campeón</span>
              <span className="bs-val">{champion || <em>—</em>}</span>
            </div>
            <div className="bs-pill">
              <span className="bs-label">España</span>
              <span className="bs-val">{spainResult || <em>—</em>}</span>
            </div>
            <div className="bs-pill">
              <span className="bs-label">MVP</span>
              <span className="bs-val">{mvp || <em>—</em>}</span>
            </div>
          </div>
          {bonus?.points > 0 && (
            <div className="bonus-points">
              Puntos obtenidos: <strong>+{bonus.points} pts</strong>
            </div>
          )}
          {!isLocked && (
            <button className="bf-edit-btn" onClick={() => setCollapsed(false)}>
              <Pencil size={13} /> Editar
            </button>
          )}
        </div>
      )}

      {/* Expanded form */}
      {!collapsed && (
        <>
          <p className="bonus-desc">Predice los resultados finales del Mundial. Solo puedes editar esto antes del inicio del torneo.</p>
          <form onSubmit={handleSave} className="bonus-form">
            <div className="bf-group">
              <label>Máximo Goleador</label>
              <input
                type="text"
                placeholder="Ej. Mbappé"
                value={topScorer}
                onChange={e => setTopScorer(e.target.value)}
                disabled={isLocked || saving}
              />
            </div>
            <div className="bf-group">
              <label>Campeón del Mundial</label>
              <input
                type="text"
                placeholder="Ej. Brasil"
                value={champion}
                onChange={e => setChampion(e.target.value)}
                disabled={isLocked || saving}
              />
            </div>
            <div className="bf-group">
              <label>Resultado de España</label>
              <select
                value={spainResult}
                onChange={e => setSpainResult(e.target.value)}
                disabled={isLocked || saving}
              >
                <option value="">Selecciona...</option>
                <option value="Fase de grupos">Fase de grupos</option>
                <option value="Dieciseisavos de final">Dieciseisavos de final</option>
                <option value="Octavos de final">Octavos de final</option>
                <option value="Cuartos de final">Cuartos de final</option>
                <option value="Semifinales">Semifinales</option>
                <option value="Final">Final</option>
                <option value="Campeón">Campeón</option>
              </select>
            </div>
            <div className="bf-group">
              <label>MVP del Mundial</label>
              <input
                type="text"
                placeholder="Ej. Vinicius Jr."
                value={mvp}
                onChange={e => setMvp(e.target.value)}
                disabled={isLocked || saving}
              />
            </div>

            <div className="bf-actions">
              {hasPredictions && (
                <button type="button" className="bf-cancel-btn" onClick={() => setCollapsed(true)}>
                  Cancelar
                </button>
              )}
              <button type="submit" className="bf-btn" disabled={saving}>
                {saving ? "Guardando..." : "Guardar Bonus"}
              </button>
            </div>

            {bonus?.points > 0 && (
              <div className="bonus-points">
                Puntos obtenidos: <strong>+{bonus.points} pts</strong>
              </div>
            )}
          </form>
        </>
      )}

      <style jsx>{`
        .bonus-section {
          margin-bottom: 1.5rem;
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.05), rgba(251, 191, 36, 0.02));
          border-color: rgba(251, 191, 36, 0.2);
        }
        .bonus-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0;
        }
        .bonus-header h2 {
          font-size: 1.1rem;
          color: var(--gold);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .bonus-header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        :global(.chevron) {
          color: var(--text-dim);
        }
        .locked-badge {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.7rem;
          background: rgba(255,255,255,0.1);
          padding: 2px 8px;
          border-radius: 4px;
          color: var(--text-muted);
        }
        .bonus-desc {
          font-size: 0.75rem;
          color: var(--text-dim);
          margin-top: 0.6rem;
          margin-bottom: 1rem;
        }

        /* Collapsed summary */
        .bonus-summary {
          margin-top: 0.75rem;
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .bs-pills {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.4rem;
        }
        .bs-pill {
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
          padding: 0.45rem 0.65rem;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .bs-label {
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-dim);
        }
        .bs-val {
          font-size: 0.82rem;
          font-weight: 600;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .bs-val em {
          color: var(--text-dim);
          font-style: normal;
        }
        .bf-edit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.35rem;
          width: 100%;
          padding: 0.5rem;
          border-radius: var(--radius-sm);
          border: 1px solid rgba(251,191,36,0.3);
          background: rgba(251,191,36,0.07);
          color: var(--gold);
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s;
        }
        .bf-edit-btn:hover {
          background: rgba(251,191,36,0.14);
        }

        /* Expanded form */
        .bonus-form {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        .bf-group {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .bf-group label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .bf-group input, .bf-group select {
          background: var(--bg-input);
          border: 1px solid var(--border);
          padding: 0.6rem;
          border-radius: var(--radius-sm);
          color: var(--text-primary);
          font-size: 0.85rem;
        }
        .bf-group input:focus, .bf-group select:focus {
          outline: none;
          border-color: var(--gold);
        }
        .bf-group input:disabled, .bf-group select:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .bf-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }
        .bf-btn {
          flex: 1;
          background: linear-gradient(135deg, var(--gold), #f59e0b);
          color: #000;
          font-weight: 700;
          padding: 0.7rem;
          border-radius: var(--radius-sm);
          border: none;
          cursor: pointer;
        }
        .bf-btn:disabled {
          opacity: 0.5;
        }
        .bf-cancel-btn {
          padding: 0.7rem 1rem;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
          background: transparent;
          color: var(--text-muted);
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
        }
        .bf-cancel-btn:hover {
          background: rgba(255,255,255,0.05);
        }
        .bonus-points {
          background: rgba(251, 191, 36, 0.15);
          color: var(--gold);
          padding: 0.5rem;
          border-radius: 4px;
          text-align: center;
          font-size: 0.85rem;
        }
      `}</style>
    </div>
  );
}
