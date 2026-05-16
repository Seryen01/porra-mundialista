"use client";

import { signOut, useSession } from "next-auth/react";
import { LogOut, Shield, Mail, ChevronRight, Camera, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export default function ProfilePage() {
  const { data: session } = useSession();
  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState<any>(null);
  const [localImage, setLocalImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = (session?.user as any)?.role === "ADMIN";
  const userImage = localImage || userData?.image;

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
          <div className="avatar-ring">
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

      {/* Info list */}
      <div className="info-list card animate-in stagger-1">
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
      `}</style>
    </div>
  );
}
