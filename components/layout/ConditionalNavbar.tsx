"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Ne pas afficher la navbar sur les pages de chat, profil et avatar-fx
  if (pathname === "/messages" ||
      pathname === "/chat-video" ||
      pathname === "/mon-double-ia/assistant" ||
      pathname === "/mon-double-ia/coach" ||
      pathname === "/mon-double-ia/confident" ||
      pathname === "/compte" ||
      pathname === "/avatar-fx" ||
      pathname === "/") {
    return null;
  }

  return <Navbar />;
}
