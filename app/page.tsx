"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { UserPlus, Wand2, User } from "lucide-react";
import { WelcomeGiftPopup } from "@/components/ui/WelcomeGiftPopup";

import { STATIC_AVATARS, type StaticAvatar } from "@/lib/static-characters";

/**
 * Ordre d'affichage des cartes personnages (IDs).
 * Mettez les IDs dans l'ordre souhaité. Ex: [3, 1, 2] → le personnage 3 en premier, puis 1, puis 2.
 * Laisser [] pour garder l'ordre de l'API.
 */
const CHARACTER_DISPLAY_ORDER: number[] = [5, 6, 7]; // Jade, Léa, Elora en première position

/**
 * Position manuelle en grille (optionnel).
 * Clé = ID du personnage, valeur = { row: 1, col: 1 } (ligne et colonne, à partir de 1).
 * Les cartes sans entrée ici sont placées après. Ex: { 1: { row: 1, col: 1 }, 2: { row: 1, col: 2 } }
 */
const CARD_GRID_POSITION: Record<number, { row: number; col: number }> = {};

// Fonction pour formater le nombre de discussions
const formatMessagesCount = (count: number): string => {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  } else if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

// Composant pour la carte d'avatar
const AvatarCard = ({ avatar, className = "", gridStyle }: { avatar: StaticAvatar; className?: string; gridStyle?: React.CSSProperties }) => {
  const [imageError, setImageError] = useState(false);

  return (
    <Link 
      href={`/chat-video?characterId=${avatar.id}`} 
      className={`character-card ${className}`}
      style={gridStyle}
    >
      {avatar.photoUrl && !imageError ? (
        <img 
          src={avatar.photoUrl} 
          alt={avatar.name} 
          className="character-image"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="character-image">👤</div>
      )}
      <div className="character-info">
        <div className="character-name">{avatar.name}</div>
        <div className="character-desc">Par {avatar.creator.displayName}</div>
        <div className="flex items-center justify-between" style={{ marginTop: '8px', color: '#A3A3A3', fontSize: '12px' }}>
          <span>💬 {formatMessagesCount(avatar.messagesCount)}</span>
          <span style={{ color: '#3BB9FF', fontSize: '14px', fontWeight: '600', textShadow: '0 0 8px rgba(59, 185, 255, 0.8), 0 0 12px rgba(59, 185, 255, 0.5)' }}>FX</span>
        </div>
      </div>
    </Link>
  );
};

interface RecentConversation {
  id: string;
  characterId: string | null;
  storyId?: string | null;
  name: string;
  photoUrl: string;
  timestamp: string;
  lastMessage: string;
}

export default function HomePage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showAvatarFXMenu, setShowAvatarFXMenu] = useState(false);
  const [avatars] = useState<StaticAvatar[]>(STATIC_AVATARS);
  const [loadingAvatars] = useState(false);
  const [recentConversations, setRecentConversations] = useState<RecentConversation[]>([]);
  const [showWelcomeGift, setShowWelcomeGift] = useState(false);
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  // Countdown promo qui se renouvelle à minuit
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const midnight = new Date();
      midnight.setHours(24, 0, 0, 0);
      const diff = midnight.getTime() - now.getTime();
      setCountdown({
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  // Les avatars sont maintenant statiques (STATIC_AVATARS) - plus besoin de les charger depuis l'API

  // Charger les conversations récentes depuis la DB
  useEffect(() => {
    const loadRecentConversations = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId || userId.startsWith('user_') || userId.startsWith('temp_') || isNaN(Number(userId))) return;

      try {
        const response = await fetch(`/api/conversations?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.conversations) {
            setRecentConversations(data.conversations);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error);
      }
    };

    loadRecentConversations();
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

  // Fermer le menu AvatarFX si on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const menuContainer = document.querySelector('.avatar-fx-menu-container');
      if (showAvatarFXMenu && menuContainer && !menuContainer.contains(target)) {
        setShowAvatarFXMenu(false);
      }
    };

    if (showAvatarFXMenu) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 100);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showAvatarFXMenu]);

  // Initialiser les crédits guest et afficher le popup de bienvenue
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const isLoggedIn = userId && !userId.startsWith('user_') && !userId.startsWith('temp_') && !isNaN(Number(userId));

    if (isLoggedIn) return;

    // Offrir 3 crédits aux nouveaux visiteurs
    if (!localStorage.getItem('guestCredits')) {
      localStorage.setItem('guestCredits', '3');
    }

    // Popup de bienvenue (une fois par session)
    const timer = setTimeout(() => {
      const hasSeenWelcome = sessionStorage.getItem('hasSeenWelcomeGift');
      if (hasSeenWelcome) return;

      sessionStorage.setItem('hasSeenWelcomeGift', 'true');
      setShowWelcomeGift(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const sortedAvatars =
    CHARACTER_DISPLAY_ORDER.length > 0
      ? [...avatars].sort((a, b) => {
          const iA = CHARACTER_DISPLAY_ORDER.indexOf(a.id);
          const iB = CHARACTER_DISPLAY_ORDER.indexOf(b.id);
          if (iA === -1 && iB === -1) return 0;
          if (iA === -1) return 1;
          if (iB === -1) return -1;
          return iA - iB;
        })
      : avatars;

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
          padding-top: 70px;
          overflow-y: auto;
        }

        .hero-image-wrap {
          margin-left: -30px;
          margin-right: -30px;
          margin-bottom: 24px;
          width: calc(100% + 60px);
          max-width: none;
          border-radius: 0;
          overflow: hidden;
        }

        .hero-image {
          width: 100%;
          height: auto;
          aspect-ratio: 3 / 2;
          object-fit: cover;
          display: block;
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
          height: 360px;
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

        /* Promo Banner */
        .promo-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 40px;
          background: linear-gradient(90deg, #e91e63, #9c27b0, #e91e63);
          background-size: 200% 100%;
          animation: promoGradient 3s ease infinite;
          z-index: 1002;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 600;
          color: white;
          text-align: center;
          padding: 0 12px;
        }

        @keyframes promoGradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .promo-banner .promo-timer {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: rgba(0, 0, 0, 0.3);
          padding: 2px 8px;
          border-radius: 4px;
          font-variant-numeric: tabular-nums;
          font-size: 13px;
        }

        /* Top Header Bar */
        .top-header {
          display: none;
          position: fixed;
          top: 40px;
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
          padding: 5px 12px;
          border-radius: 16px;
          border: 1.5px solid #3BB9FF;
          background: transparent;
          color: #3BB9FF;
          font-weight: 600;
          font-size: 12px;
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
          height: 58px;
          background: #1A1A1A;
          border-top: 1px solid #3BB9FF;
          border-bottom: 1px solid #2A2A2A;
          z-index: 1001;
          justify-content: space-around;
          align-items: center;
          padding: 6px 0;
          padding-bottom: env(safe-area-inset-bottom, 6px);
        }

        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 3px;
          color: #A3A3A3;
          text-decoration: none;
          font-size: 11px;
          transition: color 0.2s;
          padding: 5px 11px;
        }

        .nav-item.active {
          color: #3BB9FF;
        }

        .nav-item:hover {
          color: #3BB9FF;
        }

        .nav-item svg {
          width: 22px;
          height: 22px;
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
            height: 62px;
          }

          .btn-connexion {
            padding: 4px 10px;
            font-size: 11px;
            border-radius: 14px;
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
            padding-top: 96px;
            padding-left: 16px;
            padding-right: 16px;
          }

          .sidebar.active {
            left: 0;
          }

          .sidebar-recents {
            margin-top: 24px !important;
          }

          .main-content {
            padding: 20px;
            padding-top: 102px;
            padding-bottom: 90px;
          }

          .hero-image-wrap {
            margin-left: -20px;
            margin-right: -20px;
            width: calc(100% + 40px);
          }

          .logo-desktop {
            display: none;
          }

          .characters-grid {
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 12px;
          }

          .character-image {
            height: 260px;
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

      {/* Promo Banner */}
      <div className="promo-banner">
        <span>Promotion -70% Saint-Valentin</span>
        <span className="promo-timer">
          {String(countdown.hours).padStart(2, '0')}h {String(countdown.minutes).padStart(2, '0')}m {String(countdown.seconds).padStart(2, '0')}s
        </span>
      </div>

      <div className="page-container">
        {/* Top Header Mobile */}
        <header className={`top-header ${!isHeaderVisible ? 'hidden' : ''}`}>
          <button className={`burger-btn ${menuOpen ? 'active' : ''}`} onClick={toggleMenu}>
            <span></span>
            <span></span>
            <span></span>
          </button>

          <div className="logo-center">
            <img src="/Logo%20lumineux%20de%20swayco.ai.png" alt="swayco.ai" width={360} height={92} className="h-[96px] w-auto object-contain mt-2" />
          </div>

          <Link
            href="/connexion"
            className="btn-connexion"
            onClick={(e) => {
              const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
              const isConnected = userId && !userId.startsWith("user_") && !userId.startsWith("temp_") && !isNaN(Number(userId));
              if (isConnected) {
                e.preventDefault();
                router.push("/compte");
              }
            }}
          >
            Connexion
          </Link>
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
          <Link href="/tarification" className="sidebar-item block" onClick={toggleMenu}>⭐ S'abonner</Link>
          <Link href="/credits" className="sidebar-item block" onClick={toggleMenu}>💳 Crédits</Link>

          <div className="sidebar-recents" style={{ marginTop: '40px' }}>
            <h3 style={{ fontSize: '14px', color: '#A3A3A3', marginBottom: '12px' }}>Récents</h3>
            {recentConversations.length > 0 ? (
              recentConversations.slice(0, 3).map((conversation) => {
                // Construire l'URL avec les bons paramètres
                let href = '/chat-video';
                const params = new URLSearchParams();
                if (conversation.characterId) {
                  params.append('characterId', conversation.characterId);
                }
                if (conversation.storyId) {
                  params.append('storyId', conversation.storyId);
                }
                if (params.toString()) {
                  href = `/chat-video?${params.toString()}`;
                }

                return (
                  <Link
                    key={conversation.id}
                    href={href}
                    className="sidebar-item block flex items-center gap-2"
                    onClick={toggleMenu}
                  >
                    <div className="w-8 h-8 rounded-full flex-shrink-0 overflow-hidden bg-[#252525] border border-[#2A2A2A]">
                      {conversation.photoUrl ? (
                        <img src={conversation.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#6B7280] text-sm">👤</div>
                      )}
                    </div>
                    <span className="truncate">{conversation.name}</span>
                  </Link>
                );
              })
            ) : (
              <div className="sidebar-item" style={{ color: '#6B7280', cursor: 'default' }}>
                Aucune conversation
              </div>
            )}
          </div>
        </aside>

        {/* Contenu principal */}
        <main className="main-content">
          {/* Image principale sous le header */}
          <div className="hero-image-wrap">
            <img
              src="/main-image.png"
              alt="swayco.ai - Et toi, ta le sway coco??"
              className="hero-image"
            />
          </div>
          {/* Logo centré (desktop) */}
          <div className="logo-desktop" style={{ textAlign: 'center', marginBottom: '30px' }}>
            <img src="/Logo%20lumineux%20de%20swayco.ai.png" alt="swayco.ai" width={440} height={112} className="h-28 w-auto object-contain mx-auto" />
          </div>


          {/* Section "Pour vous" */}
          <section>
            <h2 style={{ marginBottom: '4px', fontSize: '22px' }}>Pour vous</h2>
            <p style={{ color: '#A3A3A3', fontSize: '12px', marginBottom: '16px' }}>(exclu en dm 🔥)</p>

            {/* Filtres Femme - en bas sous le sous-titre */}
            <div className="flex gap-6 border-b border-[#2A2A2A] mb-5 pb-0">
              <button
                type="button"
                className="flex items-center gap-2 pb-3 border-b-2 transition-colors border-[#3BB9FF] text-white"
              >
                <User className="w-5 h-5" strokeWidth={1.5} />
                <span className="text-sm font-medium">Femme</span>
              </button>
            </div>

            {loadingAvatars ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#A3A3A3' }}>
                Chargement des avatars...
              </div>
            ) : avatars.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#A3A3A3' }}>
                Aucun avatar disponible pour le moment.
              </div>
            ) : (
              <>
                <div className="characters-grid">
                  {sortedAvatars.slice(0, 6).map((avatar) => (
                    <AvatarCard
                      key={avatar.id}
                      avatar={avatar}
                      gridStyle={
                        CARD_GRID_POSITION[avatar.id]
                          ? {
                              gridRow: CARD_GRID_POSITION[avatar.id].row,
                              gridColumn: CARD_GRID_POSITION[avatar.id].col,
                            }
                          : undefined
                      }
                    />
                  ))}

                  {sortedAvatars.slice(6).map((avatar) => (
                      <AvatarCard
                        key={avatar.id}
                        avatar={avatar}
                        className={`extra-card ${showMore ? 'show' : ''}`}
                        gridStyle={
                          CARD_GRID_POSITION[avatar.id]
                            ? {
                                gridRow: CARD_GRID_POSITION[avatar.id].row,
                                gridColumn: CARD_GRID_POSITION[avatar.id].col,
                              }
                            : undefined
                        }
                      />
                    ))}
                </div>

                {avatars.length > 6 && (
                  <button
                    className="show-more-btn"
                    onClick={() => setShowMore(!showMore)}
                  >
                    {showMore ? 'Voir moins ▲' : 'Voir plus ▼'}
                  </button>
                )}
              </>
            )}
          </section>
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
          <div className="relative avatar-fx-menu-container">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setShowAvatarFXMenu(!showAvatarFXMenu);
              }}
              className={`nav-item ${showAvatarFXMenu ? 'active' : ''}`}
            >
              <Wand2 className="w-6 h-6 fill-current" />
              <span>Créer</span>
            </button>

            {/* Menu déroulant */}
            {showAvatarFXMenu && (
              <>
                {/* Overlay pour fermer le menu */}
                <div
                  className="fixed inset-0 z-[100]"
                  onClick={() => setShowAvatarFXMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10, x: 76 }}
                  animate={{ opacity: 1, y: 0, x: 76 }}
                  exit={{ opacity: 0, y: 10, x: 76 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="absolute bottom-full right-0 mb-2 w-56 bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl shadow-2xl overflow-hidden z-[101]"
                >
                  <div className="py-2">
                    <div
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setShowAvatarFXMenu(false);
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 text-white cursor-not-allowed opacity-70"
                    >
                      <UserPlus className="w-5 h-5 text-[#3BB9FF]" />
                      <span className="text-sm">Disponible le <span className="text-[#3BB9FF]">15/02</span></span>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </div>
          <Link href="/compte" className="nav-item">
            <svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
            <span>Profil</span>
          </Link>
        </nav>

        {/* Welcome Gift Popup for non-logged-in users */}
        <WelcomeGiftPopup
          isOpen={showWelcomeGift}
          onClose={() => setShowWelcomeGift(false)}
        />

        {/* Promo Saint-Valentin - maintenant déclenché via InsufficientCreditsModal */}
      </div>
    </>
  );
}
