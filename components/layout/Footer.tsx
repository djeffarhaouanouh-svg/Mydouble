"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#1A1A1A] border-t border-[#2A2A2A] text-white py-8 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Section 1 : À propos */}
          <div>
            <h3 className="text-xl font-bold mb-4">
              <span className="text-white">swayco</span><span className="text-[#3BB9FF]">.ai</span>
            </h3>
            <p className="text-[#A3A3A3] text-sm">
              Conversations personnalisées avec vos créatrices préférées, alimentées par l&apos;IA.
            </p>
          </div>

          {/* Section 2 : Légal */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/mentions-legales" className="text-[#A3A3A3] hover:text-[#3BB9FF] transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/cgv" className="text-[#A3A3A3] hover:text-[#3BB9FF] transition-colors">
                  CGV
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="text-[#A3A3A3] hover:text-[#3BB9FF] transition-colors">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-[#A3A3A3] hover:text-[#3BB9FF] transition-colors">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Section 3 : Support */}
          <div>
            <h4 className="font-semibold mb-4 text-white">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="text-[#A3A3A3] hover:text-[#3BB9FF] transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-[#A3A3A3] hover:text-[#3BB9FF] transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[#2A2A2A] pt-6 text-center text-sm text-[#A3A3A3]">
          <p>&copy; {new Date().getFullYear()} MyDouble. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
}
