"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Calendar, User, Settings } from "lucide-react";
import { useSession } from "next-auth/react";

export default function Navigation() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session) return null;

  const isAdmin = (session?.user as any)?.role === "ADMIN";

  const navItems = [
    { name: "Partidos", href: "/", icon: Calendar },
    { name: "Ranking", href: "/leaderboard", icon: Trophy },
    { name: "Perfil", href: "/profile", icon: User },
  ];

  if (isAdmin) {
    navItems.push({ name: "Admin", href: "/admin", icon: Settings });
  }

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${isActive ? "active" : ""}`}
          >
            <div className={`nav-icon-wrap ${isActive ? "active" : ""}`}>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
            </div>
            <span>{item.name}</span>
          </Link>
        );
      })}
      <style jsx>{`
        .bottom-nav {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 72px;
          background: rgba(10, 14, 26, 0.92);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          display: flex;
          justify-content: space-around;
          align-items: center;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          z-index: 1000;
          padding-bottom: env(safe-area-inset-bottom);
        }
        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          color: var(--text-dim);
          font-size: 11px;
          font-weight: 500;
          gap: 4px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
        }
        .nav-icon-wrap {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .nav-icon-wrap.active {
          background: var(--green-glow);
          color: var(--green);
        }
        .nav-item.active {
          color: var(--green);
        }
        .nav-item:active {
          transform: scale(0.92);
        }
      `}</style>
    </nav>
  );
}
