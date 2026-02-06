"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";

interface Conversation {
  id: string;
  characterId: string | null;
  storyId?: string | null;
  name: string;
  photoUrl: string;
  timestamp: string;
  lastMessage: string;
  isCreatedCharacter?: boolean;
}

interface CreatedCharacter {
  id: number;
  name: string;
  photoUrl?: string;
  createdAt: string;
}

export default function MessagesPage() {
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [createdCharacters, setCreatedCharacters] = useState<CreatedCharacter[]>([]);

  // Gérer la visibilité du header au scroll (le header principal peut descendre)
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

  // Charger les personnages créés par l'utilisateur
  useEffect(() => {
    const loadCreatedCharacters = async () => {
      try {
        const userId = localStorage.getItem('userId');
        if (!userId || userId.startsWith('user_') || userId.startsWith('temp_') || isNaN(Number(userId))) {
          return;
        }

        const response = await fetch(`/api/user/creations?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.characters && data.characters.length > 0) {
            setCreatedCharacters(data.characters);
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des personnages créés:', error);
      }
    };

    loadCreatedCharacters();
  }, []);

  // Charger les conversations depuis la base de données (source de vérité)
  useEffect(() => {
    const loadConversationsFromDB = async () => {
      const userId = localStorage.getItem('userId');
      if (!userId || userId.startsWith('user_') || userId.startsWith('temp_') || isNaN(Number(userId))) {
        // Fallback localStorage pour les utilisateurs non connectés
        try {
          const stored = localStorage.getItem('recentConversations');
          if (stored) {
            setConversations(JSON.parse(stored));
          }
        } catch (error) {
          console.error('Erreur chargement localStorage:', error);
        }
        return;
      }

      try {
        // Afficher le cache localStorage en attendant la réponse DB
        const stored = localStorage.getItem('recentConversations');
        if (stored) {
          setConversations(JSON.parse(stored));
        }

        // Charger depuis la DB (source de vérité)
        const response = await fetch(`/api/conversations?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.conversations) {
            setConversations(data.conversations);
            // Mettre à jour le cache localStorage
            localStorage.setItem('recentConversations', JSON.stringify(data.conversations));
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement des conversations:', error);
      }
    };

    loadConversationsFromDB();

    // Écouter l'événement personnalisé pour recharger (même onglet)
    const handleConversationsUpdated = () => {
      loadConversationsFromDB();
    };

    window.addEventListener('conversationsUpdated', handleConversationsUpdated);

    return () => {
      window.removeEventListener('conversationsUpdated', handleConversationsUpdated);
    };
  }, []);

  // Header toujours visible - pas de logique de scroll

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

        /* Top Header - peut descendre au scroll */
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
          padding-top: 56px; /* 56px pour le header seulement */
          margin-top: 0;
          padding-bottom: 20px;
        }
        
        /* Ajouter un peu de marge pour les discussions */
        .conversations-list {
          margin-top: 0;
          padding-top: 14px;
        }
        
        .conversation-item:first-child {
          margin-top: 0;
          padding-top: 14px;
        }

        .messages-title-bar {
          display: flex;
          align-items: center;
          padding: 0 16px;
          height: 56px;
          background: #0F0F0F;
          border-bottom: 1px solid #2A2A2A;
          /* Scroll avec le contenu, pas fixe */
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



        /* Conversation List */
        .conversations-list {
          list-style: none;
          padding: 0;
          margin: 0;
          margin-top: 0;
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
          width: 48px;
          height: 48px;
          border-radius: 50%;
          padding: 0;
          background: transparent;
        }

        .avatar-border.gradient-purple-orange {
          background: transparent;
        }

        .avatar-border.gradient-orange-pink {
          background: transparent;
        }

        .avatar-border.gradient-orange-yellow {
          background: transparent;
        }

        .avatar-border.gradient-blue-green {
          background: transparent;
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
            <img src="/Logo%20lumineux%20de%20swayco.ai.png" alt="swayco.ai" width={360} height={92} className="h-[96px] w-auto object-contain mt-2" />
          </div>
          <div style={{ width: '36px' }} />
        </header>

        {/* Messages Content */}
        <div className="messages-content">
          {/* Messages Title Bar - scrolls with content */}
          <div className="messages-title-bar">
            <div className="title-left">
              <h1 className="messages-title">Messages</h1>
            </div>
          </div>

          {/* Conversations List */}
          <ul className="conversations-list">
            {/* Personnages créés en premier */}
            {createdCharacters.map((char, index) => {
              // Vérifier si ce personnage a déjà une conversation
              const hasConversation = conversations.some(
                (conv) => conv.characterId === String(char.id)
              );

              return (
                <Link key={`created-${char.id}`} href={`/chat-video?characterId=${char.id}`}>
                  <li className="conversation-item" style={{ borderLeft: '3px solid #3BB9FF' }}>
                    <div className="avatar-container">
                      <div className={`avatar-border ${getGradientClass(index)}`}>
                        <div className="avatar">
                          {char.photoUrl ? (
                            <img src={char.photoUrl} alt={char.name} onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent) {
                                const initials = document.createElement('span');
                                initials.textContent = getInitials(char.name);
                                parent.appendChild(initials);
                              }
                            }} />
                          ) : (
                            <span>{getInitials(char.name)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="conversation-content">
                      <div className="conversation-header">
                        <span className="conversation-username">{char.name}</span>
                        <span style={{ fontSize: '10px', color: '#3BB9FF', marginLeft: '8px', padding: '2px 6px', background: '#3BB9FF20', borderRadius: '4px' }}>
                          Mon perso
                        </span>
                      </div>
                      <div className="conversation-preview">
                        <span className="message-text">
                          {hasConversation ? 'Conversation en cours' : 'Commencer une conversation'}
                        </span>
                      </div>
                    </div>
                  </li>
                </Link>
              );
            })}

            {/* Conversations existantes (sauf celles des personnages créés déjà affichés) */}
            {conversations
              .filter((conv) => !createdCharacters.some((char) => String(char.id) === conv.characterId))
              .map((conv, index) => {
                const gradientClass = getGradientClass(index + createdCharacters.length);

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
              })}

            {/* Message si aucune conversation */}
            {createdCharacters.length === 0 && conversations.length === 0 && (
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
