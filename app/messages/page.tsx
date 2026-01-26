"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BellOff, Check } from "lucide-react";

interface Conversation {
  id: string;
  characterId: string | null;
  storyId?: string | null;
  name: string;
  photoUrl: string;
  timestamp: string;
  lastMessage: string;
}

export default function MessagesPage() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [displayedText, setDisplayedText] = useState("");

  // Effet typewriter pour le logo
  useEffect(() => {
    const fullText = "swayco.ai";
    let currentIndex = 0;
    
    const typeInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, 100); // 100ms entre chaque lettre

    return () => clearInterval(typeInterval);
  }, []);

  // Charger les conversations récentes depuis localStorage
  useEffect(() => {
    const loadRecentConversations = () => {
      try {
        const stored = localStorage.getItem('recentConversations');
        if (stored) {
          const conversationsData = JSON.parse(stored);
          setConversations(conversationsData);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error);
      }
    };

    loadRecentConversations();

    // Écouter les changements de localStorage (entre onglets)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'recentConversations') {
        loadRecentConversations();
      }
    };

    // Écouter l'événement personnalisé (même onglet)
    const handleConversationsUpdated = () => {
      loadRecentConversations();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('conversationsUpdated', handleConversationsUpdated);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('conversationsUpdated', handleConversationsUpdated);
    };
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

  const getInitials = (name: string) => {
    // Extraire les initiales du prénom
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
    }
    return name.substring(0, 2).toUpperCase();
  };

  const getGradientClass = (index: number) => {
    const gradients = [
      "gradient-purple-orange",
      "gradient-orange-pink",
      "gradient-orange-yellow",
      "gradient-blue-green",
    ];
    return gradients[index % gradients.length] || "no-gradient";
  };

  return (
    <>
      <style jsx global>{`
        .messages-page {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #0F0F0F;
          color: #FFFFFF;
          min-height: 100vh;
        }

        /* Top Header */
        .messages-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          height: 56px;
          background: #0F0F0F;
          border-bottom: 1px solid #2A2A2A;
          z-index: 1001;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 16px;
          transition: transform 0.3s ease-in-out;
          position: relative;
        }

        .messages-header.hidden {
          transform: translateY(-100%);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .back-button {
          background: transparent;
          border: none;
          color: #FFFFFF;
          cursor: pointer;
          padding: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .logo-center {
          position: absolute;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
        }



        /* Messages Content */
        .messages-content {
          padding-top: 112px;
        }

        .messages-title-bar {
          position: fixed;
          top: 56px;
          left: 0;
          right: 0;
          display: flex;
          align-items: center;
          padding: 0 16px;
          height: 56px;
          background: #0F0F0F;
          border-bottom: 1px solid #2A2A2A;
          z-index: 1000;
        }

        .title-left {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .messages-title {
          font-size: 20px;
          font-weight: 700;
        }

        .bell-off-icon {
          color: #A3A3A3;
        }


        /* Conversation List */
        .conversations-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .conversation-item {
          display: flex;
          align-items: center;
          padding: 12px 16px;
          border-bottom: 1px solid #2A2A2A;
          cursor: pointer;
          transition: background 0.2s;
          gap: 12px;
        }

        .conversation-item:hover {
          background: #1A1A1A;
        }

        .avatar-container {
          position: relative;
          flex-shrink: 0;
        }

        .avatar-border {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          padding: 2px;
        }

        .avatar-border.gradient-purple-orange {
          background: linear-gradient(135deg, #a855f7, #f97316);
        }

        .avatar-border.gradient-orange-pink {
          background: linear-gradient(135deg, #f97316, #ec4899);
        }

        .avatar-border.gradient-orange-yellow {
          background: linear-gradient(135deg, #f97316, #eab308);
        }

        .avatar-border.gradient-blue-green {
          background: linear-gradient(135deg, #3b82f6, #22c55e);
        }

        .avatar-border.no-gradient {
          background: transparent;
          padding: 0;
        }

        .avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: #252525;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #FFFFFF;
          font-weight: 600;
          font-size: 20px;
          overflow: hidden;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .conversation-content {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .conversation-header {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .conversation-username {
          font-weight: 600;
          font-size: 15px;
          color: #FFFFFF;
        }

        .verified-icon {
          width: 16px;
          height: 16px;
          color: #3BB9FF;
          flex-shrink: 0;
        }

        .evil-eye-icon {
          font-size: 16px;
          line-height: 1;
          flex-shrink: 0;
        }

        .conversation-preview {
          font-size: 14px;
          color: #A3A3A3;
        }

        .message-text {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (min-width: 768px) {
          .messages-content {
            max-width: 600px;
            margin: 0 auto;
          }
        }
      `}</style>

      <div className="messages-page">
        {/* Top Header */}
        <header className={`messages-header ${!isHeaderVisible ? 'hidden' : ''}`}>
          <div className="header-left">
            <Link href="/" className="back-button">
              <ArrowLeft size={20} />
            </Link>
          </div>
          <div className="logo-center">
            <svg width="140" height="36" viewBox="0 0 1400 360" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="swayBlueMessages" x1="0" y1="0" x2="1400" y2="0" gradientUnits="userSpaceOnUse">
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
                {displayedText.length <= 6 ? (
                  <tspan fill="transparent" stroke="white" strokeWidth="7" strokeLinejoin="round">
                    {displayedText}
                  </tspan>
                ) : (
                  <>
                    <tspan fill="transparent" stroke="white" strokeWidth="7" strokeLinejoin="round">
                      {displayedText.substring(0, 6)}
                    </tspan>
                    <tspan fill="transparent" stroke="url(#swayBlueMessages)" strokeWidth="7" strokeLinejoin="round">
                      {displayedText.substring(6)}
                    </tspan>
                  </>
                )}
              </text>
            </svg>
          </div>
          <div style={{ width: '36px' }} />
        </header>

        {/* Messages Content */}
        <div className="messages-content">
          <div className="messages-title-bar">
            <div className="title-left">
              <h1 className="messages-title">Messages</h1>
              <BellOff size={18} className="bell-off-icon" />
            </div>
          </div>

          {/* Conversations List */}
          <ul className="conversations-list">
            {conversations.length > 0 ? (
              conversations.map((conv, index) => {
                const gradientClass = getGradientClass(index);
                
                // Construire l'URL avec les bons paramètres
                let href = '/chat-video';
                const params = new URLSearchParams();
                if (conv.characterId) {
                  params.append('characterId', conv.characterId);
                }
                if (conv.storyId) {
                  params.append('storyId', conv.storyId);
                }
                if (params.toString()) {
                  href = `/chat-video?${params.toString()}`;
                }
                
                return (
                  <Link key={conv.id} href={href}>
                    <li className="conversation-item">
                      <div className="avatar-container">
                        <div className={`avatar-border ${gradientClass}`}>
                          <div className="avatar">
                            {conv.photoUrl ? (
                              <img src={conv.photoUrl} alt={conv.name} onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  const initials = document.createElement('span');
                                  initials.textContent = getInitials(conv.name);
                                  parent.appendChild(initials);
                                }
                              }} />
                            ) : (
                              <span>{getInitials(conv.name)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="conversation-content">
                        <div className="conversation-header">
                          <span className="conversation-username">{conv.name}</span>
                        </div>
                        {conv.lastMessage && conv.lastMessage !== 'Envoyé' && (
                          <div className="conversation-preview">
                            <span className="message-text">{conv.lastMessage}</span>
                          </div>
                        )}
                      </div>
                    </li>
                  </Link>
                );
              })
            ) : (
              <li style={{ padding: '40px 16px', textAlign: 'center', color: '#A3A3A3' }}>
                Aucune conversation
              </li>
            )}
          </ul>
        </div>

      </div>
    </>
  );
}
