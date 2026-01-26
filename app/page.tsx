"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [prenom, setPrenom] = useState<string | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (!userId || userId.startsWith("user_") || userId.startsWith("temp_") || isNaN(Number(userId))) {
      setPrenom(null);
      return;
    }
    fetch(`/api/user/profile?userId=${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const name = data?.user?.name ?? data?.name;
        if (name && typeof name === "string") {
          setPrenom(name.split(" ")[0]);
        } else {
          setPrenom(null);
        }
      })
      .catch(() => setPrenom(null));
  }, []);

  // Gérer la visibilité du header au scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < 10) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <>
      <style jsx global>{`
        .page-container {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #0F0F0F;
          color: #FFFFFF;
          display: flex;
          min-height: 100vh;
        }

        /* Panneau gauche */
        .sidebar {
          width: 260px;
          background: #1A1A1A;
          border-right: 1px solid #2A2A2A;
          padding: 20px;
        }

        .sidebar h2 {
          margin-bottom: 20px;
          font-size: 18px;
        }

        .sidebar-item {
          padding: 12px;
          margin-bottom: 8px;
          border-radius: 8px;
          background: #252525;
          cursor: pointer;
          transition: all 0.2s;
        }

        .sidebar-item:hover {
          background: #2F2F2F;
          transform: translateX(2px);
        }

        /* Contenu principal */
        .main-content {
          flex: 1;
          padding: 30px;
          overflow-y: auto;
        }

        .header {
          margin-bottom: 30px;
        }

        .header h1 {
          font-size: 28px;
          margin-bottom: 2px;
        }

        .header p {
          color: #A3A3A3;
        }

        /* Cards personnages */
        .characters-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 40px;
        }

        .character-card {
          background: #1E1E1E;
          border-radius: 12px;
          overflow: hidden;
          cursor: pointer;
          transition: all 0.3s;
          border: 1px solid #2A2A2A;
          text-decoration: none;
          color: inherit;
          display: block;
        }

        .character-card:hover {
          transform: translateY(-4px);
          border-color: #3bb9ff;
          box-shadow: 0 8px 24px rgba(31, 121, 255, 0.2);
        }

        .character-image {
          width: 100%;
          height: 200px;
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          object-fit: cover;
        }

        .character-info {
          padding: 16px;
        }

        .character-name {
          font-weight: 600;
          margin-bottom: 4px;
        }

        .character-desc {
          color: #A3A3A3;
          font-size: 13px;
        }

        /* Boutons */
        .btn {
          padding: 12px 24px;
          border-radius: 8px;
          border: none;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #8B5CF6, #EC4899);
          color: white;
        }

        .btn-primary:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
        }

        .btn-secondary {
          background: #252525;
          color: white;
        }

        .btn-secondary:hover {
          background: #2F2F2F;
        }

        /* Section scènes */
        .scenes-section {
          margin-top: 40px;
        }

        .scenes-section h2 {
          margin-bottom: 20px;
          font-size: 22px;
        }

        /* Top Header Bar */
        .top-header {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 56px;
          background: #0F0F0F;
          border-bottom: 1px solid #2A2A2A;
          z-index: 1001;
          align-items: center;
          justify-content: space-between;
          padding: 0 12px;
          transition: transform 0.3s ease-in-out;
        }

        .top-header.hidden {
          transform: translateY(-100%);
        }

        .top-header .logo-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
        }

        .btn-connexion {
          padding: 8px 16px;
          border-radius: 20px;
          border: 2px solid #3BB9FF;
          background: transparent;
          color: #3BB9FF;
          font-weight: 600;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          flex-shrink: 0;
          text-decoration: none;
          display: inline-block;
        }

        .btn-connexion:hover {
          background: #3BB9FF;
          color: #0F0F0F;
        }

        /* Menu Burger */
        .burger-btn {
          display: flex;
          background: transparent;
          border: none;
          padding: 10px;
          cursor: pointer;
          flex-direction: column;
          gap: 4px;
          flex-shrink: 0;
        }

        .burger-btn span {
          display: block;
          width: 24px;
          height: 2px;
          background: #FFFFFF;
          transition: all 0.3s;
        }

        .burger-btn.active span:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .burger-btn.active span:nth-child(2) {
          opacity: 0;
        }

        .burger-btn.active span:nth-child(3) {
          transform: rotate(-45deg) translate(5px, -5px);
        }

        .overlay {
          display: none;
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.5);
          z-index: 999;
        }

        .overlay.active {
          display: block;
        }

        /* Bottom Nav Bar Mobile */
        .bottom-nav {
          display: none;
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          height: 65px;
          background: #1A1A1A;
          border-top: 1px solid #3BB9FF;
          border-bottom: 1px solid #2A2A2A;
          z-index: 1001;
          justify-content: space-around;
          align-items: center;
          padding: 8px 0;
          padding-bottom: env(safe-area-inset-bottom, 8px);
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          color: #A3A3A3;
          text-decoration: none;
          font-size: 11px;
          transition: color 0.2s;
          padding: 8px 12px;
        }

        .nav-item.active {
          color: #3BB9FF;
        }

        .nav-item:hover {
          color: #3BB9FF;
        }

        .nav-item svg {
          width: 24px;
          height: 24px;
          fill: currentColor;
        }

        /* Bouton Voir plus */
        .show-more-btn {
          display: none;
          width: 100%;
          padding: 12px;
          margin-top: 16px;
          background: #252525;
          border: 1px solid #2A2A2A;
          border-radius: 8px;
          color: #3BB9FF;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .show-more-btn:hover {
          background: #2F2F2F;
        }

        /* Cartes supplémentaires */
        .extra-card {
          display: block;
        }

        /* Responsive Mobile */
        @media (max-width: 768px) {
          .top-header {
            display: flex;
          }

          .bottom-nav {
            display: flex;
          }

          .sidebar {
            position: fixed;
            top: 0;
            left: -280px;
            height: 100vh;
            z-index: 1000;
            transition: left 0.3s ease;
            padding-top: 66px;
          }

          .sidebar.active {
            left: 0;
          }

          .main-content {
            padding: 20px;
            padding-top: 70px;
            padding-bottom: 90px;
          }

          .logo-desktop {
            display: none;
          }

          .characters-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 12px;
          }

          .character-image {
            height: 150px;
          }

          .header h1 {
            font-size: 22px;
          }

          .show-more-btn {
            display: block;
          }

          .extra-card {
            display: none;
          }

          .extra-card.show {
            display: block;
          }
        }
      `}</style>

      <div className="page-container">
        {/* Top Header Mobile */}
        <header className={`top-header ${!isHeaderVisible ? 'hidden' : ''}`}>
          <button className={`burger-btn ${menuOpen ? 'active' : ''}`} onClick={toggleMenu}>
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className="logo-center">
            <svg width="180" height="46" viewBox="0 0 1400 360" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="swayBlueMobile" x1="0" y1="0" x2="1400" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0B2030"/>
                  <stop offset="18%" stopColor="#124B6B"/>
                  <stop offset="35%" stopColor="#1E7FB0"/>
                  <stop offset="55%" stopColor="#3BB9FF"/>
                  <stop offset="70%" stopColor="#2FA9F2"/>
                  <stop offset="85%" stopColor="#A9E8FF"/>
                  <stop offset="94%" stopColor="#F6FDFF"/>
                  <stop offset="100%" stopColor="#FFFFFF"/>
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="transparent"/>
              <text x="50%" y="60%" textAnchor="middle"
                fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial"
                fontSize="170" fontWeight="800">
                <tspan fill="transparent" stroke="white" strokeWidth="7" strokeLinejoin="round">swayco</tspan>
                <tspan fill="transparent" stroke="url(#swayBlueMobile)" strokeWidth="7" strokeLinejoin="round">.ai</tspan>
              </text>
            </svg>
          </div>

          <Link href="/connexion" className="btn-connexion">Connexion</Link>
        </header>

        {/* Overlay */}
        <div className={`overlay ${menuOpen ? 'active' : ''}`} onClick={toggleMenu}></div>

        {/* Panneau gauche */}
        <aside className={`sidebar ${menuOpen ? 'active' : ''}`}>
          <h2>Menu</h2>

          <Link href="/" className="sidebar-item block" onClick={toggleMenu}>🏠 Accueil</Link>
          <Link href="/messages" className="sidebar-item block" onClick={toggleMenu}>💬 Messages</Link>
          <Link href="/avatar-fx" className="sidebar-item block" onClick={toggleMenu}>🎬 AvatarFX</Link>
          <Link href="/compte" className="sidebar-item block" onClick={toggleMenu}>👤 Profil</Link>
          <div className="sidebar-item">⭐ S'abonner</div>

          <div style={{ marginTop: '40px' }}>
            <h3 style={{ fontSize: '14px', color: '#A3A3A3', marginBottom: '12px' }}>Récents</h3>
            <div className="sidebar-item">💬 Conversation 1</div>
            <div className="sidebar-item">💬 Conversation 2</div>
          </div>
        </aside>

        {/* Contenu principal */}
        <main className="main-content">
          {/* Logo centré (desktop) */}
          <div className="logo-desktop" style={{ textAlign: 'center', marginBottom: '30px' }}>
            <svg width="220" height="56" viewBox="0 0 1400 360" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="swayBlue" x1="0" y1="0" x2="1400" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#0B2030"/>
                  <stop offset="18%" stopColor="#124B6B"/>
                  <stop offset="35%" stopColor="#1E7FB0"/>
                  <stop offset="55%" stopColor="#3BB9FF"/>
                  <stop offset="70%" stopColor="#2FA9F2"/>
                  <stop offset="85%" stopColor="#A9E8FF"/>
                  <stop offset="94%" stopColor="#F6FDFF"/>
                  <stop offset="100%" stopColor="#FFFFFF"/>
                </linearGradient>
              </defs>
              <rect width="100%" height="100%" fill="transparent"/>
              <text x="50%" y="60%" textAnchor="middle"
                fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial"
                fontSize="170" fontWeight="800">
                <tspan fill="transparent" stroke="white" strokeWidth="7" strokeLinejoin="round">swayco</tspan>
                <tspan fill="transparent" stroke="url(#swayBlue)" strokeWidth="7" strokeLinejoin="round">.ai</tspan>
              </text>
            </svg>
          </div>

          {/* Header */}
          <div className="header">
            <h1>Bon retour parmi nous,</h1>
            <p style={{ color: '#3BB9FF', fontWeight: 600 }}>{prenom ?? 'SleepyMuskrat6820'}</p>
          </div>

          {/* Section "Pour vous" */}
          <section>
            <h2 style={{ marginBottom: '4px', fontSize: '22px' }}>Pour vous</h2>
            <p style={{ color: '#A3A3A3', fontSize: '12px', marginBottom: '20px' }}>(Créé par les utilisateurs)</p>

            <div className="characters-grid">
              <Link href="/chat-video" className="character-card">
                <img src="/avatar-1.png" alt="bangchan" className="character-image" />
                <div className="character-info">
                  <div className="character-name">bangchan</div>
                  <div className="character-desc">Par @httpsjunjun</div>
                  <div style={{ marginTop: '8px', color: '#A3A3A3', fontSize: '12px' }}>💬 38.1k</div>
                </div>
              </Link>

              <Link href="/chat-video" className="character-card">
                <div className="character-image">👑</div>
                <div className="character-info">
                  <div className="character-name">Goblin King Jareth</div>
                  <div className="character-desc">Par @h0nkme</div>
                  <div style={{ marginTop: '8px', color: '#A3A3A3', fontSize: '12px' }}>💬 0</div>
                </div>
              </Link>

              <Link href="/chat-video" className="character-card">
                <div className="character-image">💖</div>
                <div className="character-info">
                  <div className="character-name">Till Lindemann</div>
                  <div className="character-desc">Par @CoffeeMilk119</div>
                  <div style={{ marginTop: '8px', color: '#A3A3A3', fontSize: '12px' }}>💬 15.3k</div>
                </div>
              </Link>

              <Link href="/chat-video" className="character-card">
                <div className="character-image">🌟</div>
                <div className="character-info">
                  <div className="character-name">Jamie Campbell</div>
                  <div className="character-desc">Par @Henrycreelswhats</div>
                  <div style={{ marginTop: '8px', color: '#A3A3A3', fontSize: '12px' }}>💬 43.9k</div>
                </div>
              </Link>

              <Link href="/chat-video" className="character-card">
                <div className="character-image">🎸</div>
                <div className="character-info">
                  <div className="character-name">Rock Star</div>
                  <div className="character-desc">Par @musiclover</div>
                  <div style={{ marginTop: '8px', color: '#A3A3A3', fontSize: '12px' }}>💬 22.5k</div>
                </div>
              </Link>

              <Link href="/chat-video" className="character-card">
                <div className="character-image">🦋</div>
                <div className="character-info">
                  <div className="character-name">Butterfly</div>
                  <div className="character-desc">Par @dreamer</div>
                  <div style={{ marginTop: '8px', color: '#A3A3A3', fontSize: '12px' }}>💬 18.2k</div>
                </div>
              </Link>

              {/* Cartes supplémentaires (cachées par défaut sur mobile) */}
              <Link href="/chat-video" className={`character-card extra-card ${showMore ? 'show' : ''}`}>
                <div className="character-image">🎭</div>
                <div className="character-info">
                  <div className="character-name">Drama Queen</div>
                  <div className="character-desc">Par @theater</div>
                  <div style={{ marginTop: '8px', color: '#A3A3A3', fontSize: '12px' }}>💬 12.1k</div>
                </div>
              </Link>

              <Link href="/chat-video" className={`character-card extra-card ${showMore ? 'show' : ''}`}>
                <div className="character-image">🌙</div>
                <div className="character-info">
                  <div className="character-name">Night Owl</div>
                  <div className="character-desc">Par @nightsky</div>
                  <div style={{ marginTop: '8px', color: '#A3A3A3', fontSize: '12px' }}>💬 9.8k</div>
                </div>
              </Link>
            </div>

            {/* Bouton Voir plus (mobile uniquement) */}
            <button
              className="show-more-btn"
              onClick={() => setShowMore(!showMore)}
            >
              {showMore ? 'Voir moins ▲' : 'Voir plus ▼'}
            </button>
          </section>

          {/* Section Jeux de rôle */}
          <section className="scenes-section">
            <h2>Jeux de rôle</h2>
            <div className="characters-grid">
              <Link href="/chat-video" className="character-card">
                <div className="character-image" style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)' }}>🔥</div>
                <div className="character-info">
                  <div className="character-name">Met Gala Scene</div>
                  <div className="character-desc">Sélectionnez un personnage</div>
                </div>
              </Link>

              <Link href="/chat-video" className="character-card">
                <div className="character-image" style={{ background: 'linear-gradient(135deg, #10B981, #3B82F6)' }}>🏠</div>
                <div className="character-info">
                  <div className="character-name">Reverse Isekai</div>
                  <div className="character-desc">Sélectionnez un personnage</div>
                </div>
              </Link>
            </div>
          </section>

          {/* Boutons de test */}
          <div style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
            <button className="btn btn-primary">Créer un personnage</button>
            <button className="btn btn-secondary">Explorer</button>
          </div>
        </main>

        {/* Bottom Navigation Mobile */}
        <nav className="bottom-nav">
          <Link href="/" className="nav-item active">
            <svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>
            <span>Accueil</span>
          </Link>
          <Link href="/messages" className="nav-item">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
            <span>Messages</span>
          </Link>
          <Link href="/avatar-fx" className="nav-item">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
            <span>AvatarFX</span>
          </Link>
          <Link href="/compte" className="nav-item">
            <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            <span>Profil</span>
          </Link>
        </nav>
      </div>
    </>
  );
}
