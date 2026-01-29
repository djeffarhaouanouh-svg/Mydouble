"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Ne pas afficher le footer sur les pages de chat, avatar-fx, connexion et inscription
  if (pathname === "/messages" ||
      pathname === "/chat-video" ||
      pathname === "/mon-double-ia/assistant" ||
      pathname === "/mon-double-ia/coach" ||
      pathname === "/mon-double-ia/confident" ||
      pathname === "/avatar-fx" ||
      pathname === "/voix" ||
      pathname === "/histoire" ||
      pathname === "/connexion" ||
      pathname === "/inscription") {
    return null;
  }

  return <Footer />;
}
