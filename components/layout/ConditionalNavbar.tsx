"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Ne pas afficher la navbar sur les pages de chat
  if (pathname === "/messages" || 
      pathname === "/mon-double-ia/assistant" || 
      pathname === "/mon-double-ia/coach" || 
      pathname === "/mon-double-ia/confident") {
    return null;
  }

  return <Navbar />;
}
