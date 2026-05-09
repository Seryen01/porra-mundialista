"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { getFlagUrl } from "@/lib/flags";

interface Prediction {
  id: string;
  predictedScoreA: number;
  predictedScoreB: number;
  points: number;
  user: { id: string; name: string };
}

interface Match {
  id: string;
  teamA: string;
  teamB: string;
  date: string;
  phase: string;
  scoreA: number;
  scoreB: number;
  predictions: Prediction[];
}

const avatarColors = [
  "linear-gradient(135deg, #fbbf24, #f59e0b)",
  "linear-gradient(135deg, #c0c0c0, #9ca3af)",
  "linear-gradient(135deg, #cd7f32, #b45309)",
  "linear-gradient(135deg, #8b5cf6, #7c3aed)",
  "linear-gradient(135deg, #06b6d4, #0891b2)",
  "linear-gradient(135deg, #ec4899, #db2777)",
  "linear-gradient(135deg, #10b981, #059669)",
];

// Stable color per user name
const nameIndex: Record<string, number> = {};
function getAvatarColor(name: string) {
  if (nameIndex[name] === undefined) {
    nameIndex[name] = Object.keys(nameIndex).length % avatarColors.length;
  }
  return avatarColors[nameIndex[name]];
}

export default function Historico() {
  const { status } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    else if (status === "authenticated") {
      fetch("/api/historico")
        .then(r => r.json())
        .then(data => { setMatches(data); setLoading(false); });
    }
  }, [status]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Cargando histórico...</span>
      </div>
    );
  }

  return (
    <div className="historico animate-in">
      <header className="hist-header">
        <h1>📋 Histórico</h1>
        <span className="hist-sub">{matches.length} partidos finalizados</span>
      </header>

      {matches.length === 0 ? (
        <div className="empty-state card animate-in stagger-1">
          <span className="empty-icon">⏳</span>
          <p>Aún no hay partidos finalizados.</p>
          <span className="empty-sub">Aquí aparecerán los resultados en cuanto terminen los primeros partidos.</span>
        </div>
      ) : (
        <div className="feed">
          {matches.map((match, i) => (
            <HistoricoCard key={match.id} match={match} index={i} />
          ))}
        </div>
      )}

      <style jsx>{`
        .historico { padding-top: 1.25rem; }
        .hist-header { margin-bottom: 1.5rem; }
        .hist-header h1 {
          font-size: 1.6rem;
          font-weight: 800;
          margin-bottom: 0.2rem;
        }
        .hist-sub {
          font-size: 0.75rem;
          color: var(--text-muted);
        }
        .feed {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .empty-state {
          padding: 3rem 2rem;
          text-align: center;
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.6rem;
        }
        .empty-icon { font-size: 2.5rem; }
        .empty-sub { font-size: 0.75rem; color: var(--text-dim); }
      `}</style>
    </div>
  );
}

function HistoricoCard({ match, index }: { match: Match; index: number }) {
  const winnerA = match.scoreA > match.scoreB;
  const winnerB = match.scoreB > match.scoreA;
  const draw = match.scoreA === match.scoreB;

  return (
    <div className="hcard card animate-in" style={{ animationDelay: `${index * 0.06}s` }}>
      {/* Header */}
      <div className="hcard-top">
        <span className="hcard-phase">{match.phase}</span>
        <span className="hcard-date">
          {format(new Date(match.date), "d MMM · HH:mm", { locale: es })}
        </span>
      </div>

      {/* Result */}
      <div className="hcard-result">
        <div className={`hcard-team ${winnerA ? 'winner' : ''}`}>
          <img src={getFlagUrl(match.teamA)} alt={match.teamA} className="hcard-flag" />
          <span className="hcard-tname">{match.teamA}</span>
        </div>
        <div className="hcard-score-box">
          <span className={`hcard-score ${winnerA ? 'score-winner' : ''}`}>{match.scoreA}</span>
          <span className="hcard-dash">–</span>
          <span className={`hcard-score ${winnerB ? 'score-winner' : ''}`}>{match.scoreB}</span>
        </div>
        <div className={`hcard-team hcard-team-right ${winnerB ? 'winner' : ''}`}>
          <span className="hcard-tname">{match.teamB}</span>
          <img src={getFlagUrl(match.teamB)} alt={match.teamB} className="hcard-flag" />
        </div>
      </div>

      {/* Divider */}
      <div className="hcard-divider">
        <span className="hcard-divider-label">Pronósticos</span>
      </div>

      {/* Predictions grid */}
      {match.predictions.length === 0 ? (
        <div className="hcard-no-preds">Nadie apostó en este partido</div>
      ) : (
        <div className="hcard-preds">
          {match.predictions.map((pred) => {
            const isExact = pred.predictedScoreA === match.scoreA && pred.predictedScoreB === match.scoreB;
            const isCorrectResult =
              pred.points > 0 && !isExact;
            const predWinA = pred.predictedScoreA > pred.predictedScoreB;
            const predWinB = pred.predictedScoreB > pred.predictedScoreA;
            const predDraw = pred.predictedScoreA === pred.predictedScoreB;
            const correctTendency =
              (predWinA && winnerA) || (predWinB && winnerB) || (predDraw && draw);

            return (
              <div key={pred.id} className={`pred-row ${isExact ? 'exact' : ''} ${isCorrectResult ? 'correct' : ''} ${pred.points === 0 ? 'miss' : ''}`}>
                <div className="pred-user">
                  <div className="pred-avatar" style={{ background: getAvatarColor(pred.user.name) }}>
                    {pred.user.name[0]}
                  </div>
                  <span className="pred-name">{pred.user.name}</span>
                </div>
                <div className="pred-bet">
                  <span className="pred-score">{pred.predictedScoreA} – {pred.predictedScoreB}</span>
                  {isExact && <span className="pred-badge exact-badge">⭐ Exacto</span>}
                  {isCorrectResult && <span className="pred-badge correct-badge">✓ Resultado</span>}
                  {pred.points === 0 && <span className="pred-badge miss-badge">✗ Fallo</span>}
                </div>
                <div className="pred-pts">
                  <span className={`pts-val ${isExact ? 'pts-exact' : ''} ${isCorrectResult ? 'pts-correct' : ''} ${pred.points === 0 ? 'pts-miss' : ''}`}>
                    +{pred.points}
                  </span>
                  <span className="pts-label">pts</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style jsx>{`
        .hcard { padding: 0; overflow: hidden; }

        .hcard-top {
          display: flex;
          justify-content: space-between;
          padding: 0.55rem 1rem;
          background: rgba(0,0,0,0.2);
          border-bottom: 1px solid var(--border);
        }
        .hcard-phase {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-muted);
        }
        .hcard-date {
          font-size: 0.68rem;
          color: var(--text-dim);
          font-weight: 500;
        }

        .hcard-result {
          display: flex;
          align-items: center;
          padding: 1rem;
          gap: 0.5rem;
        }
        .hcard-team {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          opacity: 0.6;
          transition: opacity 0.2s;
        }
        .hcard-team.winner { opacity: 1; }
        .hcard-team-right { justify-content: flex-end; }
        .hcard-flag {
          width: 32px;
          height: 22px;
          object-fit: cover;
          border-radius: 3px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.1);
          flex-shrink: 0;
        }
        .hcard-tname {
          font-size: 0.8rem;
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .hcard-score-box {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          flex-shrink: 0;
          background: rgba(0,0,0,0.25);
          padding: 0.4rem 0.75rem;
          border-radius: 10px;
          border: 1px solid var(--border);
        }
        .hcard-score {
          font-size: 1.4rem;
          font-weight: 900;
          color: var(--text-muted);
          min-width: 20px;
          text-align: center;
        }
        .hcard-score.score-winner { color: var(--text-primary); }
        .hcard-dash {
          color: var(--text-dim);
          font-weight: 700;
          font-size: 1rem;
        }

        .hcard-divider {
          display: flex;
          align-items: center;
          padding: 0 1rem;
          margin: 0 0 0.5rem;
          gap: 0.5rem;
        }
        .hcard-divider::before, .hcard-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border);
        }
        .hcard-divider-label {
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--text-dim);
          white-space: nowrap;
        }

        .hcard-no-preds {
          padding: 0.75rem 1rem 1rem;
          font-size: 0.78rem;
          color: var(--text-dim);
          text-align: center;
        }

        .hcard-preds {
          display: flex;
          flex-direction: column;
          padding: 0 0.75rem 0.75rem;
          gap: 0.35rem;
        }
        .pred-row {
          display: flex;
          align-items: center;
          padding: 0.5rem 0.6rem;
          border-radius: 8px;
          gap: 0.5rem;
          background: rgba(255,255,255,0.02);
          border: 1px solid transparent;
        }
        .pred-row.exact {
          background: rgba(251, 191, 36, 0.07);
          border-color: rgba(251, 191, 36, 0.2);
        }
        .pred-row.correct {
          background: var(--green-glow);
          border-color: rgba(0, 200, 83, 0.15);
        }
        .pred-row.miss {
          opacity: 0.5;
        }

        .pred-user {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          flex: 1;
          min-width: 0;
        }
        .pred-avatar {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.7rem;
          color: #000;
          flex-shrink: 0;
        }
        .pred-name {
          font-size: 0.8rem;
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pred-bet {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          flex-shrink: 0;
        }
        .pred-score {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-secondary);
          font-variant-numeric: tabular-nums;
        }
        .pred-badge {
          font-size: 0.58rem;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
          white-space: nowrap;
        }
        .exact-badge {
          background: rgba(251, 191, 36, 0.15);
          color: var(--gold);
        }
        .correct-badge {
          background: rgba(0, 200, 83, 0.12);
          color: var(--green);
        }
        .miss-badge {
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
        }

        .pred-pts {
          text-align: right;
          flex-shrink: 0;
          display: flex;
          align-items: baseline;
          gap: 1px;
        }
        .pts-val {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--text-dim);
        }
        .pts-val.pts-exact { color: var(--gold); }
        .pts-val.pts-correct { color: var(--green); }
        .pts-val.pts-miss { color: var(--text-dim); }
        .pts-label {
          font-size: 0.55rem;
          font-weight: 600;
          color: var(--text-dim);
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}
