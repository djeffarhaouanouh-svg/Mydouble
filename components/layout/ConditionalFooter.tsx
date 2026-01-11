"use client";

import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();
  
  // Ne pas afficher le footer sur la page messages
  if (pathname === "/messages") {
    return null;
  }

  return (
    <div className="pb-20">
      <Footer />
    </div>
  );
}
