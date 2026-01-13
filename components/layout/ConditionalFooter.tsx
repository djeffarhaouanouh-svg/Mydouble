"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Ne pas afficher le footer sur les pages de chat
  if (pathname === "/messages" || 
      pathname === "/mon-double-ia/assistant" || 
      pathname === "/mon-double-ia/coach" || 
      pathname === "/mon-double-ia/confident") {
    return null;
  }

  return (
    <div className="pb-20">
      <Footer />
    </div>
  );
}
