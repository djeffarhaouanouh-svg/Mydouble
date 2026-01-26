"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CheckSquare, MessageSquare, User } from "lucide-react";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Accueil", icon: Home },
    { href: "/avatar-fx", label: "AvatarFX", icon: CheckSquare },
    { href: "/messages", label: "Messages", icon: MessageSquare },
    { href: "/compte", label: "Profil", icon: User },
  ];

  // Ne pas afficher sur certaines pages
  if (
    pathname === "/chat-video" ||
    pathname === "/avatar-visio" ||
    pathname === "/connexion" ||
    pathname === "/inscription" ||
    pathname.startsWith("/mon-double-ia/")
  ) {
    return null;
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A1A] border-t border-[#2A2A2A]">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-around items-center py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors group"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    isActive
                      ? "bg-[#3BB9FF] text-white"
                      : "text-[#A3A3A3] group-hover:text-white"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={`text-[11px] ${
                    isActive
                      ? "text-[#3BB9FF] font-semibold"
                      : "text-[#A3A3A3] group-hover:text-white"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
