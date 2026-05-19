"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { getFlagUrl, getCode, countryNames } from "@/lib/flags";
import { Plus, Check, Zap, Trash2, Edit2, X } from "lucide-react";

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form states for creating matches
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
    const isoDate = new Date(date).toISOString();
    await fetch("/api/matches", {
      method: "POST",
      body: JSON.stringify({ teamA, teamB, date: isoDate, phase }),
    });
    fetchMatches();
    setTeamA("");
    setTeamB("");
    setDate("");
    setShowForm(false);
  };

  const handleUpdateMatch = async (id: string, payload: any) => {
    await fetch(`/api/matches/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    fetchMatches();
  };

  const handleDeleteMatch = async (id: string) => {
    if (!confirm("¿ESTÁS SEGURO? Eliminar este partido borrará de forma irreversible todas las predicciones y puntuaciones asociadas a él.")) return;
    
    await fetch(`/api/matches/${id}`, {
      method: "DELETE",
    });
    fetchMatches();
  };

  const handleForceAutoFinish = async () => {
    if (!confirm("Esto ejecutará manualmente el proceso del Scheduler automático para finalizar partidos. ¿Deseas continuar?")) return;
    
    setLoading(true);
    const res = await fetch("/api/cron/auto-finish");
    const data = await res.json();
    alert(`Proceso completado. Partidos finalizados automáticamente: ${data.finishedCount}`);
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
        <div className="admin-actions">
          <button className="cron-btn" onClick={handleForceAutoFinish} title="Ejecutar Tarea Automática">
            <Zap size={16} /> Scheduler
          </button>
          <button className="toggle-form-btn" onClick={() => setShowForm(!showForm)}>
            <Plus size={18} />
            Nuevo
          </button>
        </div>
      </header>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleCreateMatch} className="card create-form animate-in">
          <h3>Crear Partido Manual</h3>
          <div className="form-grid">
            <input placeholder="Equipo A" value={teamA} onChange={e => setTeamA(e.target.value)} required />
            <input placeholder="Equipo B" value={teamB} onChange={e => setTeamB(e.target.value)} required />
            <input type="datetime-local" value={date} onChange={e => setDate(e.target.value)} required />
            <select value={phase} onChange={e => setPhase(e.target.value)}>
              <option>Fase de Grupos</option>
              <option>Dieciseisavos</option>
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

      <BonusSettingsSection />

      {/* Matches admin list */}
      <div className="admin-matches">
        {matches.map(match => (
          <AdminMatchCard 
            key={match.id} 
            match={match} 
            onUpdate={handleUpdateMatch} 
            onDelete={() => handleDeleteMatch(match.id)} 
          />
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
        .admin-actions {
          display: flex;
          gap: 0.5rem;
        }
        .cron-btn {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(251, 191, 36, 0.15);
          color: #fbbf24;
          padding: 0.5rem 1rem;
          border-radius: 8px;
          border: 1px solid rgba(251, 191, 36, 0.3);
          font-weight: 700;
          font-size: 0.8rem;
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

function AdminMatchCard({ match, onUpdate, onDelete }: { match: any; onUpdate: (id: string, payload: any) => void; onDelete: () => void }) {
  const [sA, setSA] = useState(match.scoreA?.toString() ?? "");
  const [sB, setSB] = useState(match.scoreB?.toString() ?? "");
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit mode states
  const [editTeamA, setEditTeamA] = useState(match.teamA);
  const [editTeamB, setEditTeamB] = useState(match.teamB);
  const [suggestionsA, setSuggestionsA] = useState<string[]>([]);
  const [suggestionsB, setSuggestionsB] = useState<string[]>([]);

  function getSuggestions(val: string) {
    if (val.length < 2) return [];
    const v = val.toLowerCase();
    return countryNames.filter(n => n.toLowerCase().includes(v)).slice(0, 8);
  }
  
  // Formatear fecha para el input datetime-local
  const d = new Date(match.date);
  const localDateStr = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,16);
  const [editDate, setEditDate] = useState(localDateStr);
  const [editPhase, setEditPhase] = useState(match.phase);

  const handleSaveDetails = () => {
    onUpdate(match.id, {
      teamA: editTeamA,
      teamB: editTeamB,
      date: new Date(editDate).toISOString(),
      phase: editPhase
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="admin-card card edit-mode animate-in">
        <div className="edit-header">
          <span className="edit-title">✏️ Editar Partido</span>
          <button className="icon-btn" onClick={() => setIsEditing(false)}><X size={16} /></button>
        </div>
        <div className="edit-grid">
          <div className="edit-field">
            <label>Equipo A</label>
            <div className="team-input-wrap">
              <img className="team-flag-preview" src={getFlagUrl(editTeamA)} alt="" />
              <input
                className="team-input"
                value={editTeamA}
                onChange={e => { setEditTeamA(e.target.value); setSuggestionsA(getSuggestions(e.target.value)); }}
                onBlur={() => setTimeout(() => setSuggestionsA([]), 150)}
                placeholder="Escribe el país…"
              />
              {suggestionsA.length > 0 && (
                <ul className="suggestions">
                  {suggestionsA.map(s => (
                    <li key={s} onMouseDown={() => { setEditTeamA(s); setSuggestionsA([]); }}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="edit-field">
            <label>Equipo B</label>
            <div className="team-input-wrap">
              <img className="team-flag-preview" src={getFlagUrl(editTeamB)} alt="" />
              <input
                className="team-input"
                value={editTeamB}
                onChange={e => { setEditTeamB(e.target.value); setSuggestionsB(getSuggestions(e.target.value)); }}
                onBlur={() => setTimeout(() => setSuggestionsB([]), 150)}
                placeholder="Escribe el país…"
              />
              {suggestionsB.length > 0 && (
                <ul className="suggestions">
                  {suggestionsB.map(s => (
                    <li key={s} onMouseDown={() => { setEditTeamB(s); setSuggestionsB([]); }}>{s}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="edit-field">
            <label>Fecha y hora (hora local)</label>
            <input type="datetime-local" value={editDate} onChange={e => setEditDate(e.target.value)} />
          </div>
          <div className="edit-field">
            <label>Fase</label>
            <select value={editPhase} onChange={e => setEditPhase(e.target.value)}>
              <optgroup label="Fase de Grupos">
                {["A","B","C","D","E","F","G","H","I","J","K","L"].map(g => (
                  <option key={g} value={`Grupo ${g}`}>Grupo {g}</option>
                ))}
              </optgroup>
              <optgroup label="Fase Final">
                <option value="Dieciseisavos">Dieciseisavos</option>
                <option value="Octavos">Octavos</option>
                <option value="Cuartos">Cuartos</option>
                <option value="Semis">Semis</option>
                <option value="Final">Final</option>
              </optgroup>
            </select>
          </div>
        </div>
        <div className="edit-actions">
          <button className="ac-btn save" onClick={handleSaveDetails}><Check size={14} /> Guardar Cambios</button>
          <button className="ac-btn delete" onClick={onDelete}><Trash2 size={14} /> Eliminar Partido</button>
        </div>

        <style jsx>{`
          .edit-mode { padding: 1rem; border-color: var(--accent); overflow: visible; }
          .edit-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
          .edit-title { font-weight: 700; font-size: 0.9rem; color: var(--gold); }
          .icon-btn { background: none; color: var(--text-muted); border: none; padding: 0; cursor: pointer; }
          .edit-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; margin-bottom: 1rem; }
          .edit-field { display: flex; flex-direction: column; gap: 0.25rem; }
          .edit-field label { font-size: 0.65rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; }
          .edit-field input:not(.team-input), .edit-field select {
            background: var(--bg-primary);
            border: 1px solid var(--border);
            padding: 0.6rem;
            border-radius: 4px;
            color: white;
            font-size: 0.8rem;
            font-family: inherit;
          }
          .edit-field input:not(.team-input):focus, .edit-field select:focus { outline: none; border-color: var(--gold); }
          .team-input-wrap {
            position: relative;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: var(--bg-primary);
            border: 1px solid var(--border);
            border-radius: 4px;
            padding: 0.35rem 0.6rem;
          }
          .team-input-wrap:focus-within { border-color: var(--gold); }
          .team-flag-preview {
            width: 28px;
            height: 18px;
            object-fit: cover;
            border-radius: 2px;
            flex-shrink: 0;
          }
          .team-input {
            flex: 1;
            background: none;
            border: none;
            padding: 0;
            color: white;
            font-size: 0.8rem;
            font-family: inherit;
            min-width: 0;
          }
          .team-input:focus { outline: none; }
          .suggestions {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #1e1e3a;
            border: 1px solid var(--border);
            border-top: none;
            border-radius: 0 0 4px 4px;
            list-style: none;
            padding: 0;
            margin: 0;
            z-index: 200;
          }
          .suggestions li {
            padding: 0.45rem 0.6rem;
            font-size: 0.8rem;
            cursor: pointer;
            color: white;
          }
          .suggestions li:hover { background: rgba(255,255,255,0.08); }
          .edit-field select option, .edit-field select optgroup { background: #1a1a2e; color: white; }
          .edit-actions { display: flex; gap: 0.5rem; }
          .ac-btn { flex: 1; padding: 0.6rem; border-radius: 6px; font-weight: 700; font-size: 0.75rem; display: flex; align-items: center; justify-content: center; gap: 0.3rem; border: none; cursor: pointer; }
          .ac-btn.save { background: var(--green); color: black; }
          .ac-btn.delete { background: rgba(239, 68, 68, 0.1); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
        `}</style>
      </div>
    );
  }

  return (
    <div className="admin-card card">
      <div className="ac-top">
        <span className="ac-phase">{match.phase}</span>
        <div className="ac-top-right">
          <span className={`ac-status ${match.status.toLowerCase()}`}>{match.status}</span>
          <button className="icon-btn edit-icon" onClick={() => setIsEditing(true)} title="Editar Detalles"><Edit2 size={12} /></button>
        </div>
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
        <button className="ac-btn live" onClick={() => onUpdate(match.id, { scoreA: sA, scoreB: sB, status: "LIVE" })}>
          <Zap size={13} /> LIVE
        </button>
        <button className="ac-btn finish" onClick={() => onUpdate(match.id, { scoreA: sA, scoreB: sB, status: "FINISHED" })}>
          <Check size={13} /> Finalizar
        </button>
        <button className={`ac-btn star ${match.isStarMatch ? 'active' : ''}`} onClick={() => onUpdate(match.id, { isStarMatch: !match.isStarMatch })}>
          ⭐ {match.isStarMatch ? "Estrella" : "Hacer Estrella"}
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
        .ac-top-right { display: flex; align-items: center; gap: 0.6rem; }
        .icon-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 2px; }
        .icon-btn:hover { color: white; }
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
        .ac-name { font-weight: 700; font-size: 0.75rem; color: var(--text-secondary); min-width: 28px; text-align: center; }
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
          border: none;
          cursor: pointer;
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
        .ac-btn.star {
          background: rgba(255, 255, 255, 0.05);
          color: var(--text-muted);
        }
        .ac-btn.star.active {
          background: linear-gradient(135deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.05));
          color: var(--gold);
          border: 1px solid rgba(251, 191, 36, 0.4);
          box-shadow: 0 0 12px rgba(251, 191, 36, 0.15);
        }
        .ac-btn:hover { filter: brightness(1.15); }
      `}</style>
    </div>
  );
}

function BonusSettingsSection() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Configuracion de puntos
  const [topScorerPoints, setTopScorerPoints] = useState(10);
  const [championPoints, setChampionPoints] = useState(15);
  const [spainPoints, setSpainPoints] = useState(10);
  const [mvpPoints, setMvpPoints] = useState(10);

  // Resultados finales
  const [actualTopScorer, setActualTopScorer] = useState("");
  const [actualChampion, setActualChampion] = useState("");
  const [actualSpainResult, setActualSpainResult] = useState("");
  const [actualMvp, setActualMvp] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    const res = await fetch("/api/settings");
    if (res.ok) {
      const data = await res.json();
      setSettings(data);
      if (data) {
        setTopScorerPoints(data.topScorerPoints ?? 10);
        setChampionPoints(data.championPoints ?? 15);
        setSpainPoints(data.spainPoints ?? 10);
        setMvpPoints(data.mvpPoints ?? 10);
        setActualTopScorer(data.actualTopScorer ?? "");
        setActualChampion(data.actualChampion ?? "");
        setActualSpainResult(data.actualSpainResult ?? "");
        setActualMvp(data.actualMvp ?? "");
      }
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm("¿Guardar y recalcular todos los bonus de los usuarios?")) return;
    
    setSaving(true);
    await fetch("/api/settings", {
      method: "PATCH",
      body: JSON.stringify({
        topScorerPoints,
        championPoints,
        spainPoints,
        mvpPoints,
        actualTopScorer,
        actualChampion,
        actualSpainResult,
        actualMvp,
      }),
    });
    setSaving(false);
    fetchSettings();
    alert("Bonus actualizados y recalculados con éxito.");
  };

  if (loading) return null;

  return (
    <div className="card create-form animate-in">
      <h3>🏆 Configuración y Resultados de Bonus</h3>
      <form onSubmit={handleSave}>
        
        <h4 className="section-title">Puntuaciones</h4>
        <div className="form-grid">
          <div>
            <label>Pts Goleador</label>
            <input type="number" value={topScorerPoints} onChange={e => setTopScorerPoints(parseInt(e.target.value))} required />
          </div>
          <div>
            <label>Pts Campeón</label>
            <input type="number" value={championPoints} onChange={e => setChampionPoints(parseInt(e.target.value))} required />
          </div>
          <div>
            <label>Pts España</label>
            <input type="number" value={spainPoints} onChange={e => setSpainPoints(parseInt(e.target.value))} required />
          </div>
          <div>
            <label>Pts MVP</label>
            <input type="number" value={mvpPoints} onChange={e => setMvpPoints(parseInt(e.target.value))} required />
          </div>
        </div>

        <h4 className="section-title">Resultados Finales Oficiales</h4>
        <div className="form-grid">
          <div>
            <label>Máximo Goleador Oficial</label>
            <input type="text" value={actualTopScorer} onChange={e => setActualTopScorer(e.target.value)} placeholder="Dejar en blanco si no ha terminado" />
          </div>
          <div>
            <label>Campeón Oficial</label>
            <input type="text" value={actualChampion} onChange={e => setActualChampion(e.target.value)} placeholder="Dejar en blanco si no ha terminado" />
          </div>
          <div>
            <label>Resultado España Oficial</label>
            <select value={actualSpainResult} onChange={e => setActualSpainResult(e.target.value)}>
              <option value="">(No definido)</option>
              <option value="Fase de grupos">Fase de grupos</option>
              <option value="Dieciseisavos de final">Dieciseisavos de final</option>
              <option value="Octavos de final">Octavos de final</option>
              <option value="Cuartos de final">Cuartos de final</option>
              <option value="Semifinales">Semifinales</option>
              <option value="Final">Final</option>
              <option value="Campeón">Campeón</option>
            </select>
          </div>
          <div>
            <label>MVP Oficial</label>
            <input type="text" value={actualMvp} onChange={e => setActualMvp(e.target.value)} placeholder="Dejar en blanco si no ha terminado" />
          </div>
        </div>

        <button type="submit" className="submit-btn bonus-save-btn" disabled={saving}>
          <Check size={16} /> {saving ? "Guardando..." : "Guardar y Recalcular Bonus"}
        </button>
      </form>

      <style jsx>{`
        .section-title {
          font-size: 0.8rem;
          color: var(--gold);
          margin-top: 1rem;
          margin-bottom: 0.5rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .form-grid label {
          display: block;
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-bottom: 0.3rem;
        }
        .bonus-save-btn {
          margin-top: 1rem;
          background: linear-gradient(135deg, var(--gold), #f59e0b);
          color: black;
        }
      `}</style>
    </div>
  );
}
