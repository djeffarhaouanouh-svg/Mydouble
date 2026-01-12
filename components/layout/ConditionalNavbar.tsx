"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

export default function ConditionalNavbar() {
  const pathname = usePathname();
  
  // Ne pas afficher la navbar sur les pages de chat
  if (pathname?.startsWith("/mon-double-ia/chat") || pathname === "/messages") {
    return null;
  }

  return <Navbar />;
}
