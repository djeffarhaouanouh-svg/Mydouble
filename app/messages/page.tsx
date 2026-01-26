"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, BellOff, Check } from "lucide-react";

interface Conversation {
  id: string;
  username: string;
  avatarUrl?: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  unreadCount?: number;
  verified?: boolean;
  specialIcon?: "evil-eye";
  borderGradient?: string;
}

export default function MessagesPage() {
  const [username, setUsername] = useState<string>("lenny_hdr");
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "1",
      username: "itsmevayna",
      lastMessage: "Envoyé",
      timestamp: "",
      unread: false,
      borderGradient: "from-purple-500 to-orange-500",
    },
    {
      id: "2",
      username: "mili_kmg",
      lastMessage: "Envoyé",
      timestamp: "",
      unread: false,
      borderGradient: "from-orange-500 to-pink-500",
    },
    {
      id: "3",
      username: "Mélissa Alpha",
      lastMessage: "Envoyé",
      timestamp: "",
      unread: false,
      verified: true,
    },
    {
      id: "4",
      username: "missalicewild.official",
      lastMessage: "Envoyé",
      timestamp: "",
      unread: false,
      verified: true,
      borderGradient: "from-orange-500 to-yellow-500",
    },
    {
      id: "5",
      username: "liabonheur_",
      lastMessage: "Envoyé",
      timestamp: "",
      unread: false,
    },
    {
      id: "6",
      username: "lauryn",
      lastMessage: "Envoyé",
      timestamp: "",
      unread: false,
      specialIcon: "evil-eye",
      borderGradient: "from-blue-500 to-green-500",
    },
    {
      id: "7",
      username: "keo",
      lastMessage: "1k si tu viens prêt ave...",
      timestamp: "5 s",
      unread: true,
      verified: true,
    },
    {
      id: "8",
      username: "syneria_agency",
      lastMessage: "3 nouveaux messages",
      timestamp: "5 s",
      unread: true,
      unreadCount: 3,
    },
    {
      id: "9",
      username: "celiabrl",
      lastMessage: "Envoyé",
      timestamp: "",
      unread: false,
    },
    {
      id: "10",
      username: "Yanis",
      lastMessage: "Okay",
      timestamp: "5 s",
      unread: false,
    },
  ]);

  useEffect(() => {
    // Récupérer le nom d'utilisateur depuis localStorage ou API
    const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
    if (userId && !userId.startsWith("user_") && !userId.startsWith("temp_") && !isNaN(Number(userId))) {
      fetch(`/api/user/profile?userId=${userId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          const name = data?.user?.name ?? data?.name;
          if (name && typeof name === "string") {
            setUsername(name.split(" ")[0].toLowerCase().replace(/\s+/g, "_"));
          }
        })
        .catch(() => {});
    }
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

  const getInitials = (username: string) => {
    return username
      .split("_")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getGradientClass = (gradient?: string) => {
    if (!gradient) return "no-gradient";
    if (gradient === "from-purple-500 to-orange-500") return "gradient-purple-orange";
    if (gradient === "from-orange-500 to-pink-500") return "gradient-orange-pink";
    if (gradient === "from-orange-500 to-yellow-500") return "gradient-orange-yellow";
    if (gradient === "from-blue-500 to-green-500") return "gradient-blue-green";
    return "no-gradient";
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
        }

        .messages-header.hidden {
          transform: translateY(-100%);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
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

        .user-info {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .username {
          font-weight: 600;
          font-size: 16px;
        }



        /* Messages Content */
        .messages-content {
          padding-top: 56px;
        }

        .messages-title-bar {
          display: flex;
          align-items: center;
          padding: 16px;
          border-bottom: 1px solid #2A2A2A;
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
          .messages-page {
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
            <div className="user-info">
              <span className="username">{username}</span>
            </div>
          </div>
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
            {conversations.map((conv) => {
              const gradientClass = getGradientClass(conv.borderGradient);
              
              return (
                <li key={conv.id} className="conversation-item">
                  <div className="avatar-container">
                    <div className={`avatar-border ${gradientClass}`}>
                      <div className="avatar">
                        {conv.avatarUrl ? (
                          <img src={conv.avatarUrl} alt={conv.username} />
                        ) : (
                          <span>{getInitials(conv.username)}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="conversation-content">
                    <div className="conversation-header">
                      <span className="conversation-username">{conv.username}</span>
                      {conv.verified && (
                        <Check size={16} className="verified-icon" />
                      )}
                      {conv.specialIcon === "evil-eye" && (
                        <span className="evil-eye-icon">👁️</span>
                      )}
                    </div>
                    <div className="conversation-preview">
                      <span className="message-text">{conv.lastMessage}</span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

      </div>
    </>
  );
}
