"use client";

import { usePathname } from "next/navigation";

export default function ConditionalMain({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Pas de padding sur les pages de chat, avatar-fx et connexion (layout dédié)
  if (pathname === "/messages" ||
      pathname === "/chat-video" ||
      pathname === "/mon-double-ia/assistant" ||
      pathname === "/mon-double-ia/coach" ||
      pathname === "/mon-double-ia/confident" ||
      pathname === "/avatar-fx" ||
      pathname === "/voix" ||
      pathname === "/histoire" ||
      pathname === "/connexion") {
    return <main className="flex-1">{children}</main>;
  }

  return <main className="pt-12 pb-16 flex-1">{children}</main>;
}
