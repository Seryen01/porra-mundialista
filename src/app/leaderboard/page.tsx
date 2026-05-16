"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface LeaderboardUser {
  id: string;
  name: string;
  image?: string | null;
  points: number;
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

export default function Leaderboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [data, setData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchLeaderboard();
    }
  }, [status]);

  const fetchLeaderboard = async () => {
    const res = await fetch("/api/leaderboard");
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Calculando ranking...</span>
      </div>
    );
  }

  const maxPoints = Math.max(...data.map(u => u.points), 1);
  const currentUserId = (session?.user as any)?.id;

  return (
    <div className="leaderboard animate-in">
      <header className="lb-header">
        <h1>🏆 Clasificación</h1>
      </header>

      {/* Podium for top 3 */}
      {data.length >= 3 && (
        <div className="podium animate-in stagger-1">
          {/* 2nd place */}
          <div className="podium-item second">
            <div 
              className="podium-avatar" 
              style={{ background: avatarColors[1], cursor: data[1].image ? 'pointer' : 'default' }}
              onClick={() => data[1].image && setSelectedImage(data[1].image)}
            >
              {data[1].image ? <img src={data[1].image} alt="" className="lb-avatar-img" /> : data[1].name[0]}
            </div>
            <span className="podium-name">{data[1].name}</span>
            <span className="podium-pts">{data[1].points} pts</span>
            <div className="podium-bar bar-2">2</div>
          </div>
          {/* 1st place */}
          <div className="podium-item first">
            <div className="crown">👑</div>
            <div 
              className="podium-avatar large" 
              style={{ background: avatarColors[0], cursor: data[0].image ? 'pointer' : 'default' }}
              onClick={() => data[0].image && setSelectedImage(data[0].image)}
            >
              {data[0].image ? <img src={data[0].image} alt="" className="lb-avatar-img" /> : data[0].name[0]}
            </div>
            <span className="podium-name">{data[0].name}</span>
            <span className="podium-pts">{data[0].points} pts</span>
            <div className="podium-bar bar-1">1</div>
          </div>
          {/* 3rd place */}
          <div className="podium-item third">
            <div 
              className="podium-avatar" 
              style={{ background: avatarColors[2], cursor: data[2].image ? 'pointer' : 'default' }}
              onClick={() => data[2].image && setSelectedImage(data[2].image)}
            >
              {data[2].image ? <img src={data[2].image} alt="" className="lb-avatar-img" /> : data[2].name[0]}
            </div>
            <span className="podium-name">{data[2].name}</span>
            <span className="podium-pts">{data[2].points} pts</span>
            <div className="podium-bar bar-3">3</div>
          </div>
        </div>
      )}

      {/* Full list */}
      <div className="lb-list card animate-in stagger-2">
        {data.map((user, index) => {
          const isMe = user.id === currentUserId;
          return (
            <div key={user.id} className={`lb-item ${isMe ? 'is-me' : ''}`}>
              <div className="lb-rank">
                {index < 3 ? (
                  <span className={`lb-medal medal-${index}`}>{["🥇", "🥈", "🥉"][index]}</span>
                ) : (
                  <span className="lb-rank-num">{index + 1}</span>
                )}
              </div>
              <div 
                className="lb-avatar" 
                style={{ background: avatarColors[index % avatarColors.length], cursor: user.image ? 'pointer' : 'default' }}
                onClick={() => user.image && setSelectedImage(user.image)}
              >
                {user.image ? <img src={user.image} alt="" className="lb-avatar-img" /> : user.name[0]}
              </div>
              <div className="lb-info">
                <span className="lb-name">
                  {user.name}
                  {isMe && <span className="lb-you">Tú</span>}
                </span>
                <div className="lb-bar-wrap">
                  <div className="lb-bar-fill" style={{ width: `${(user.points / maxPoints) * 100}%` }} />
                </div>
              </div>
              <div className="lb-pts">
                <span className="lb-pts-num">{user.points}</span>
                <span className="lb-pts-label">pts</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="image-modal" onClick={() => setSelectedImage(null)}>
          <div className="modal-content animate-in">
            <img src={selectedImage} alt="Avatar" />
            <button className="close-modal">Cerrar</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .lb-header h1 {
          font-size: 1.6rem;
          font-weight: 800;
          margin-bottom: 1.5rem;
        }

        /* Podium */
        .podium {
          display: flex;
          align-items: flex-end;
          justify-content: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          padding: 0 1rem;
        }
        .podium-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.3rem;
          flex: 1;
          position: relative;
        }
        .crown {
          font-size: 1.5rem;
          animation: float 2s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .podium-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1rem;
          color: #000;
          overflow: hidden;
        }
        .podium-avatar.large {
          width: 56px;
          height: 56px;
          font-size: 1.2rem;
          box-shadow: 0 0 20px rgba(251, 191, 36, 0.3);
        }
        .lb-avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
        .podium-name {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-secondary);
        }
        .podium-pts {
          font-size: 0.65rem;
          color: var(--text-muted);
        }
        .podium-bar {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 1rem;
          color: rgba(255,255,255,0.5);
          border-radius: 8px 8px 0 0;
          margin-top: 0.3rem;
        }
        .bar-1 {
          height: 80px;
          background: linear-gradient(180deg, rgba(251, 191, 36, 0.2), rgba(251, 191, 36, 0.05));
          border: 1px solid rgba(251, 191, 36, 0.2);
        }
        .bar-2 {
          height: 56px;
          background: linear-gradient(180deg, rgba(192, 192, 192, 0.15), rgba(192, 192, 192, 0.05));
          border: 1px solid rgba(192, 192, 192, 0.15);
        }
        .bar-3 {
          height: 40px;
          background: linear-gradient(180deg, rgba(205, 127, 50, 0.15), rgba(205, 127, 50, 0.05));
          border: 1px solid rgba(205, 127, 50, 0.15);
        }

        /* List */
        .lb-list {
          padding: 0.5rem;
        }
        .lb-item {
          display: flex;
          align-items: center;
          padding: 0.75rem 0.6rem;
          border-radius: 10px;
          gap: 0.7rem;
          transition: background 0.2s;
        }
        .lb-item:hover {
          background: rgba(255,255,255,0.03);
        }
        .lb-item.is-me {
          background: var(--green-glow);
          border: 1px solid rgba(0, 200, 83, 0.15);
        }
        .lb-rank {
          width: 32px;
          text-align: center;
          flex-shrink: 0;
        }
        .lb-medal {
          font-size: 1.1rem;
        }
        .lb-rank-num {
          font-weight: 700;
          color: var(--text-dim);
          font-size: 0.9rem;
        }
        .lb-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.85rem;
          color: #000;
          flex-shrink: 0;
          overflow: hidden;
        }
        .lb-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          min-width: 0;
        }
        .lb-name {
          font-weight: 600;
          font-size: 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }
        .lb-you {
          font-size: 0.6rem;
          font-weight: 700;
          background: var(--green);
          color: #000;
          padding: 1px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .lb-bar-wrap {
          height: 4px;
          background: rgba(255,255,255,0.05);
          border-radius: 4px;
          overflow: hidden;
        }
        .lb-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, var(--green), #00e676);
          border-radius: 4px;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .lb-pts {
          text-align: right;
          flex-shrink: 0;
        }
        .lb-pts-num {
          font-weight: 800;
          font-size: 1.15rem;
          color: var(--green);
        }
        .lb-pts-label {
          font-size: 0.55rem;
          color: var(--text-dim);
          text-transform: uppercase;
          font-weight: 600;
          margin-left: 2px;
        }

        /* Image Modal */
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
      `}</style>
    </div>
  );
}
