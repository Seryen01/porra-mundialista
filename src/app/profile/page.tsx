"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, Shield, Mail, ChevronRight, ChevronDown, ChevronUp, Camera, Loader2, Trophy, Target, TrendingUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { getFlagUrl } from "@/lib/flags";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [localImage, setLocalImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const userImage = localImage || userData?.image;
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (session) {
      fetch("/api/profile")
        .then(res => res.json())
        .then(data => setUserData(data));
    }
  }, [session]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic size validation (2MB)
    if (file.size > 2 * 1024 * 1024) {
      alert("La imagen es demasiado grande. El máximo es 2MB.");
      return;
    }

    setUploading(true);
    
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        const res = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: base64 }),
        });

        if (res.ok) {
          setLocalImage(base64);
        } else {
          alert("Error al actualizar la foto de perfil.");
        }
        setUploading(false);
      };
    } catch (error) {
      console.error(error);
      setUploading(false);
    }
  };

  return (
    <div className="profile animate-in">
      <h1>Perfil</h1>

      {/* Avatar card */}
      <div className="profile-hero card">
        <div className="avatar-edit-container">
          <div className="avatar-ring" onClick={() => userImage && setShowModal(true)} style={{ cursor: userImage ? 'pointer' : 'default' }}>
            <div className="avatar-inner">
              {uploading ? (
                <Loader2 className="animate-spin" />
              ) : userImage ? (
                <img src={userImage} alt="" className="avatar-img" />
              ) : (
                session?.user?.name?.[0]
              )}
            </div>
          </div>
          <button 
            className="edit-avatar-btn" 
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            title="Cambiar foto de perfil"
          >
            <Camera size={14} />
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            hidden 
          />
        </div>
        <h2 className="profile-name">{session?.user?.name}</h2>
        <span className="profile-email">{session?.user?.email}</span>
        <div className={`role-chip ${isAdmin ? 'admin' : ''}`}>
          <Shield size={12} />
          {isAdmin ? "Administrador" : "Jugador"}
        </div>
      </div>

      {/* Image Modal */}
      {showModal && userImage && (
        <div className="image-modal" onClick={() => setShowModal(false)}>
          <div className="modal-content animate-in">
            <img src={userImage} alt="Avatar" />
            <button className="close-modal">Cerrar</button>
          </div>
        </div>
      )}

      {/* Stats Dashboard */}
      {userData?.stats && (
        <div className="stats-dashboard animate-in stagger-1">
          <h3 className="stats-section-title">📊 Tu Rendimiento</h3>
          
          {!userData.stats.hasStats ? (
            <div className="stats-empty card">
              <span className="empty-emoji">⏳</span>
              <p>Las estadísticas se calcularán automáticamente cuando finalice el primer partido del Mundial.</p>
              <span className="empty-sub">Total pronósticos guardados: <strong>{userData.stats.totalPredictions}</strong></span>
            </div>
          ) : (
            <>
              {/* Main metrics grid */}
              <div className="metrics-grid">
                <div className="metric-card card">
                  <div className="metric-icon gold"><Trophy size={18} /></div>
                  <div className="metric-info">
                    <span className="metric-label">Puntos</span>
                    <span className="metric-val">{userData.stats.totalPoints}</span>
                    <span className="metric-sub">Puesto #{userData.stats.rank}</span>
                  </div>
                </div>
                
                <div className="metric-card card">
                  <div className="metric-icon green"><Target size={18} /></div>
                  <div className="metric-info">
                    <span className="metric-label">Acierto</span>
                    <span className="metric-val">
                      {Math.round(((userData.stats.exact + userData.stats.correctTendency) / Math.max(userData.stats.finishedPredictions, 1)) * 100)}%
                    </span>
                    <span className="metric-sub">{userData.stats.exact + userData.stats.correctTendency} de {userData.stats.finishedPredictions} aciertos</span>
                  </div>
                </div>
                
                <div className="metric-card card">
                  <div className="metric-icon purple"><TrendingUp size={18} /></div>
                  <div className="metric-info">
                    <span className="metric-label">Exactos</span>
                    <span className="metric-val">{userData.stats.exact}</span>
                    <span className="metric-sub">Marcadores exactos</span>
                  </div>
                </div>
              </div>

              {/* Guesses Distribution */}
              <div className="card distribution-card">
                <h4>Distribución de Pronósticos</h4>
                
                <div className="distribution-bars">
                  <div className="dist-item">
                    <div className="dist-header">
                      <span className="dist-label text-gold">⭐ Exactos (5/10 pts)</span>
                      <span className="dist-val">
                        {userData.stats.exact} ({userData.stats.finishedPredictions > 0 ? Math.round((userData.stats.exact / userData.stats.finishedPredictions) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="dist-bar-bg">
                      <div className="dist-bar-fill gold" style={{ width: `${userData.stats.finishedPredictions > 0 ? (userData.stats.exact / userData.stats.finishedPredictions) * 100 : 0}%` }} />
                    </div>
                  </div>

                  <div className="dist-item">
                    <div className="dist-header">
                      <span className="dist-label text-green">✓ Ganador/Empate (3/5 pts)</span>
                      <span className="dist-val">
                        {userData.stats.correctTendency} ({userData.stats.finishedPredictions > 0 ? Math.round((userData.stats.correctTendency / userData.stats.finishedPredictions) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="dist-bar-bg">
                      <div className="dist-bar-fill green" style={{ width: `${userData.stats.finishedPredictions > 0 ? (userData.stats.correctTendency / userData.stats.finishedPredictions) * 100 : 0}%` }} />
                    </div>
                  </div>

                  <div className="dist-item">
                    <div className="dist-header">
                      <span className="dist-label text-red">✗ Fallados (0 pts)</span>
                      <span className="dist-val">
                        {userData.stats.missed} ({userData.stats.finishedPredictions > 0 ? Math.round((userData.stats.missed / userData.stats.finishedPredictions) * 100) : 0}%)
                      </span>
                    </div>
                    <div className="dist-bar-bg">
                      <div className="dist-bar-fill red" style={{ width: `${userData.stats.finishedPredictions > 0 ? (userData.stats.missed / userData.stats.finishedPredictions) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Selection Insights */}
              <div className="insights-grid">
                <div className="insight-card card">
                  <span className="insight-label text-green">🟢 Tu Amuleto</span>
                  {userData.stats.bestTeam !== "Ninguno" ? (
                    <div className="insight-team">
                      <img src={getFlagUrl(userData.stats.bestTeam)} alt="" className="insight-flag" />
                      <span className="insight-team-name">{userData.stats.bestTeam}</span>
                    </div>
                  ) : (
                    <span className="insight-team-none">Aún sin datos</span>
                  )}
                  <span className="insight-desc">La selección con la que más puntos ganas en promedio.</span>
                </div>

                <div className="insight-card card">
                  <span className="insight-label text-red">🔴 Tu Kryptonita</span>
                  {userData.stats.worstTeam !== "Ninguno" ? (
                    <div className="insight-team">
                      <img src={getFlagUrl(userData.stats.worstTeam)} alt="" className="insight-flag" />
                      <span className="insight-team-name">{userData.stats.worstTeam}</span>
                    </div>
                  ) : (
                    <span className="insight-team-none">Aún sin datos</span>
                  )}
                  <span className="insight-desc">La selección con la que menos puntos ganas o más fallas.</span>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      <AllBonusSection currentUserId={(session?.user as any)?.id} />

      {/* Info list */}
      <div className="info-list card animate-in stagger-2">
        <div className="info-item">
          <div className="info-icon">
            <Mail size={18} />
          </div>
          <div className="info-content">
            <span className="info-label">Email</span>
            <span className="info-value">{session?.user?.email}</span>
          </div>
          <ChevronRight size={16} className="info-chevron" />
        </div>
        <div className="info-item">
          <div className="info-icon">
            <Shield size={18} />
          </div>
          <div className="info-content">
            <span className="info-label">Rol</span>
            <span className="info-value">{isAdmin ? "Administrador" : "Jugador"}</span>
          </div>
          <ChevronRight size={16} className="info-chevron" />
        </div>
      </div>

      {/* Logout */}
      <button onClick={() => signOut({ callbackUrl: '/login' })} className="logout-btn animate-in stagger-2">
        <LogOut size={18} />
        Cerrar Sesión
      </button>

      <style jsx>{`
        .profile h1 {
          font-size: 1.6rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
        }
        .profile-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 1.5rem;
          margin-bottom: 1rem;
          text-align: center;
        }
        .avatar-edit-container {
          position: relative;
          margin-bottom: 1rem;
          display: flex;
          justify-content: center;
        }
        .avatar-ring {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--green), #00e676);
          padding: 3px;
          margin-bottom: 0;
        }
        .avatar-inner {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: var(--bg-card);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2.2rem;
          font-weight: 800;
          color: var(--green);
          overflow: hidden;
        }
        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .edit-avatar-btn {
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: var(--gold);
          color: black;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid var(--bg-card);
          cursor: pointer;
          transition: transform 0.2s;
          z-index: 10;
        }
        .edit-avatar-btn:hover {
          transform: scale(1.1);
        }
        .edit-avatar-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .profile-name {
          font-size: 1.3rem;
          font-weight: 700;
          margin-bottom: 0.2rem;
        }
        .profile-email {
          color: var(--text-muted);
          font-size: 0.85rem;
          margin-bottom: 0.8rem;
        }
        .role-chip {
          display: flex;
          align-items: center;
          gap: 0.3rem;
          background: rgba(255,255,255,0.05);
          color: var(--text-secondary);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .role-chip.admin {
          background: var(--gold-dim);
          color: var(--gold);
        }

        .info-list {
          padding: 0.25rem 0;
          margin-bottom: 1.5rem;
        }
        .info-item {
          display: flex;
          align-items: center;
          padding: 0.9rem 1rem;
          gap: 0.8rem;
          border-bottom: 1px solid var(--border);
          transition: background 0.2s;
        }
        .info-item:last-child {
          border-bottom: none;
        }
        .info-item:hover {
          background: rgba(255,255,255,0.02);
        }
        .info-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(255,255,255,0.05);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-secondary);
          flex-shrink: 0;
        }
        .info-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .info-label {
          font-size: 0.7rem;
          color: var(--text-dim);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .info-value {
          font-size: 0.9rem;
          font-weight: 500;
          color: var(--text-primary);
        }
        .info-chevron {
          color: var(--text-dim);
          flex-shrink: 0;
        }

        .logout-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          padding: 0.9rem;
          background: rgba(239, 68, 68, 0.1);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.15);
          border-radius: var(--radius);
          font-weight: 700;
          font-size: 0.9rem;
          transition: all 0.2s;
        }
        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
        }
 
        .image-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
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

        /* Stats Dashboard styles */
        .stats-dashboard {
          margin-bottom: 1.5rem;
        }
        .stats-section-title {
          font-size: 1rem;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
          font-weight: 700;
        }
        .stats-empty {
          padding: 2rem 1.5rem;
          text-align: center;
          color: var(--text-muted);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }
        .empty-emoji {
          font-size: 2rem;
        }
        .empty-sub {
          font-size: 0.75rem;
          color: var(--text-dim);
          margin-top: 0.5rem;
        }
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
          margin-bottom: 0.75rem;
        }
        .metric-card {
          padding: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .metric-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .metric-icon.gold {
          background: var(--gold-dim);
          color: var(--gold);
        }
        .metric-icon.green {
          background: var(--green-glow);
          color: var(--green);
        }
        .metric-icon.purple {
          background: var(--purple-glow);
          color: var(--purple);
        }
        .metric-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .metric-label {
          font-size: 0.62rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.03em;
          font-weight: 600;
        }
        .metric-val {
          font-size: 1.1rem;
          font-weight: 800;
          line-height: 1.1;
          margin: 1px 0;
        }
        .metric-sub {
          font-size: 0.58rem;
          color: var(--text-dim);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .distribution-card {
          padding: 1.2rem;
          margin-bottom: 0.75rem;
        }
        .distribution-card h4 {
          font-size: 0.85rem;
          color: var(--text-secondary);
          margin-bottom: 1rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .distribution-bars {
          display: flex;
          flex-direction: column;
          gap: 0.8rem;
        }
        .dist-item {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
        }
        .dist-header {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .dist-label {
          font-size: 0.75rem;
        }
        .dist-label.text-gold { color: var(--gold); }
        .dist-label.text-green { color: var(--green); }
        .dist-label.text-red { color: #f87171; }
        .dist-val {
          color: var(--text-secondary);
          font-size: 0.72rem;
        }
        .dist-bar-bg {
          height: 6px;
          background: rgba(255, 255, 255, 0.04);
          border-radius: 3px;
          overflow: hidden;
        }
        .dist-bar-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .dist-bar-fill.gold {
          background: linear-gradient(90deg, var(--gold), #f59e0b);
        }
        .dist-bar-fill.green {
          background: linear-gradient(90deg, var(--green), #00e676);
        }
        .dist-bar-fill.red {
          background: linear-gradient(90deg, #ef4444, #f87171);
        }
        .insights-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.6rem;
        }
        .insight-card {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .insight-label {
          font-size: 0.65rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .insight-label.text-green { color: var(--green); }
        .insight-label.text-red { color: #f87171; }
        .insight-team {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0.2rem 0;
        }
        .insight-flag {
          width: 28px;
          height: 18px;
          object-fit: cover;
          border-radius: 2px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
          border: 1px solid rgba(255,255,255,0.08);
        }
        .insight-team-name {
          font-weight: 800;
          font-size: 0.9rem;
          color: var(--text-primary);
        }
        .insight-team-none {
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--text-dim);
          margin: 0.2rem 0;
        }
        .insight-desc {
          font-size: 0.62rem;
          color: var(--text-dim);
          line-height: 1.3;
        }
      `}</style>
    </div>
  );
}

const BONUS_COLS = [
  { key: "topScorer",   label: "Goleador" },
  { key: "champion",    label: "Campeón"  },
  { key: "spainResult", label: "España"   },
  { key: "mvp",         label: "MVP"      },
] as const;

function AllBonusSection({ currentUserId }: { currentUserId?: string }) {
  const [bonuses, setBonuses] = useState<any[]>([]);
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    fetch("/api/bonus/all")
      .then(r => r.json())
      .then(data => {
        setVisible(data.visible);
        setBonuses(data.bonuses || []);
        setLoading(false);
      });
  }, []);

  if (loading || !visible || bonuses.length === 0) return null;

  return (
    <div className="ab-wrap animate-in stagger-2">
      <h3 className="ab-section-title">🏆 Predicciones Bonus de todos</h3>

      <div className="ab-card card">
        <div
          className="ab-header"
          onClick={() => setCollapsed(c => !c)}
          style={{ cursor: "pointer" }}
        >
          <span className="ab-header-label">{bonuses.length} participantes</span>
          {collapsed
            ? <ChevronDown size={16} className="ab-chevron" />
            : <ChevronUp size={16} className="ab-chevron" />}
        </div>

        {!collapsed && (
          <div className="ab-table-wrap">
            <table className="ab-table">
              <thead>
                <tr>
                  <th className="ab-th ab-th-sticky">Jugador</th>
                  {BONUS_COLS.map(c => (
                    <th key={c.key} className="ab-th">{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bonuses.map((b) => (
                  <tr key={b.userId} className={`ab-tr ${b.userId === currentUserId ? "ab-tr-me" : ""}`}>
                    <td className="ab-td ab-td-sticky">
                      <span className="ab-name">
                        {b.userName}
                        {b.userId === currentUserId && <span className="ab-you">Tú</span>}
                      </span>
                    </td>
                    {BONUS_COLS.map(c => (
                      <td key={c.key} className="ab-td">
                        {b[c.key]
                          ? <span className="ab-val">{b[c.key]}</span>
                          : <span className="ab-empty">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .ab-wrap {
          margin-bottom: 1.5rem;
        }
        .ab-section-title {
          font-size: 1rem;
          color: var(--text-secondary);
          margin-bottom: 0.75rem;
          font-weight: 700;
        }
        .ab-card {
          padding: 0;
          overflow: hidden;
        }
        .ab-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border);
        }
        .ab-header-label {
          font-size: 0.75rem;
          color: var(--text-dim);
          font-weight: 600;
        }
        :global(.ab-chevron) { color: var(--text-dim); }

        .ab-table-wrap {
          overflow-x: auto;
        }
        .ab-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.78rem;
        }
        .ab-th {
          padding: 0.4rem 0.75rem;
          text-align: left;
          font-size: 0.6rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-dim);
          background: rgba(0,0,0,0.15);
          border-bottom: 1px solid var(--border);
          white-space: nowrap;
        }
        .ab-th-sticky {
          position: sticky;
          left: 0;
          z-index: 2;
          background: rgba(18,18,26,0.98);
        }
        .ab-tr {
          border-bottom: 1px solid rgba(255,255,255,0.04);
          transition: background 0.15s;
        }
        .ab-tr:last-child { border-bottom: none; }
        .ab-tr:hover { background: rgba(255,255,255,0.03); }
        .ab-tr.ab-tr-me { background: rgba(0,200,83,0.05); }
        .ab-tr.ab-tr-me:hover { background: rgba(0,200,83,0.08); }

        .ab-td {
          padding: 0.55rem 0.75rem;
          vertical-align: middle;
          white-space: nowrap;
        }
        .ab-td-sticky {
          position: sticky;
          left: 0;
          z-index: 1;
          background: var(--bg-card);
        }
        .ab-tr.ab-tr-me .ab-td-sticky {
          background: rgba(10,28,20,0.98);
        }
        .ab-name {
          font-weight: 600;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }
        .ab-you {
          font-size: 0.55rem;
          font-weight: 700;
          background: var(--green);
          color: #000;
          padding: 1px 5px;
          border-radius: 3px;
          text-transform: uppercase;
        }
        .ab-val {
          color: var(--text-secondary);
          font-weight: 500;
        }
        .ab-empty {
          color: var(--text-dim);
          opacity: 0.4;
        }
      `}</style>
    </div>
  );
}
