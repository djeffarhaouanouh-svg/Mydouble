"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Ne pas afficher le footer sur les pages de chat et avatar-fx
  if (pathname === "/messages" ||
      pathname === "/chat-video" ||
      pathname === "/mon-double-ia/assistant" ||
      pathname === "/mon-double-ia/coach" ||
      pathname === "/mon-double-ia/confident" ||
      pathname === "/avatar-fx") {
    return null;
  }

  return (
    <div className="pb-20">
      <Footer />
    </div>
  );
}
