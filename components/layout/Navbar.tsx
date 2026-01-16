"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Home, MessageSquare, User, Sparkles } from "lucide-react";
import { useState } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { href: "/", label: "Accueil", icon: Home },
    { href: "/mon-double-ia", label: "Mon double", icon: MessageSquare },
    { href: "/carte", label: "Mes cartes", icon: Sparkles },
    { href: "/compte", label: "Mon compte", icon: User },
  ];

  return (
    <>
      {/* Top Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-2 flex items-center relative">
          {/* Menu Hamburger */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="w-5 h-5 text-black" />
          </button>

          {/* Logo - Centré sur mobile, poussé à droite sur desktop */}
          <Link
            href="/"
            className="text-xl font-bold text-black absolute left-1/2 transform -translate-x-1/2 md:relative md:left-auto md:transform-none md:ml-auto"
          >
            MyDouble
          </Link>

          {/* Mon compte - Poussé à droite */}
          <Link
            href="/compte"
            className="px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors text-black text-sm ml-auto"
          >
            Compte
          </Link>
        </div>
      </nav>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 w-full z-50 bg-white border-t border-gray-200">
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
                  <Icon
                    className={`w-5 h-5 ${
                      isActive
                        ? "text-[#e31fc1]"
                        : "text-gray-400 group-hover:text-black"
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      isActive
                        ? "text-[#e31fc1] font-semibold"
                        : "text-gray-400 group-hover:text-black"
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

      {/* Menu Sidebar */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-white/50 backdrop-blur-sm"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="fixed left-0 top-0 h-full w-72 bg-white border-r border-gray-200 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-4">
              <h2 className="text-xl font-bold text-black mb-4">Menu</h2>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <Icon className="w-5 h-5 text-gray-400" />
                    <span className="text-black">{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
