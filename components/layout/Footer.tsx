"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#f5f5f7] border-t border-gray-200 text-black py-8 pb-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Section 1 : À propos */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-black">
              MyDouble
            </h3>
            <p className="text-gray-600 text-sm">
              Conversations personnalisées avec vos créatrices préférées, alimentées par l'IA.
            </p>
          </div>

          {/* Section 2 : Légal */}
          <div>
            <h4 className="font-semibold mb-4 text-black">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/mentions-legales" className="text-gray-600 hover:text-black transition-colors">
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link href="/cgv" className="text-gray-600 hover:text-black transition-colors">
                  CGV
                </Link>
              </li>
              <li>
                <Link href="/confidentialite" className="text-gray-600 hover:text-black transition-colors">
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-gray-600 hover:text-black transition-colors">
                  Cookies
                </Link>
              </li>
            </ul>
          </div>

          {/* Section 3 : Support */}
          <div>
            <h4 className="font-semibold mb-4 text-black">Support</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/contact" className="text-gray-600 hover:text-black transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-black transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright en bas du footer */}
        <div className="border-t border-gray-300 pt-8 text-center">
          <p className="text-gray-600 text-sm">
            © 2026 MyDouble. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
}
