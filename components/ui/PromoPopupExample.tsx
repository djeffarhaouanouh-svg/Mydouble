'use client';

import { useState, useEffect } from 'react';
import { PromoPopup } from './PromoPopup';

/**
 * Exemple d'utilisation du PromoPopup
 *
 * Ajoutez ce composant dans votre layout.tsx ou page.tsx pour afficher le popup
 */
export function PromoPopupExample() {
  const [isOpen, setIsOpen] = useState(false);

  // Afficher le popup après 3 secondes (ou au chargement de la page)
  useEffect(() => {
    // Vérifier si l'utilisateur a déjà fermé le popup récemment
    const lastClosed = localStorage.getItem('promoPopupClosed');
    if (lastClosed) {
      const timeSinceClosed = Date.now() - parseInt(lastClosed);
      // Ne pas afficher si fermé il y a moins de 24h
      if (timeSinceClosed < 24 * 60 * 60 * 1000) {
        return;
      }
    }

    // Afficher le popup après un délai
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Enregistrer la fermeture pour ne pas réafficher trop souvent
    localStorage.setItem('promoPopupClosed', Date.now().toString());
  };

  return (
    <PromoPopup
      isOpen={isOpen}
      onClose={handleClose}
      imageUrl="/avatar-1.png"
      badgeText="Jusqu'à 70% de réduction"
      title="Soldes des 50M d'utilisateurs"
      highlightedText="pour les Nouveaux Membres"
      subtitle="La réduction se termine bientôt. Ne ratez pas cette occasion."
      ctaText="S'abonner maintenant"
      ctaLink="/tarification"
      // endDate={new Date('2024-12-31T23:59:59')} // Optionnel: date de fin fixe
    />
  );
}

/**
 * Utilisation dans layout.tsx ou page.tsx:
 *
 * import { PromoPopupExample } from '@/components/ui/PromoPopupExample';
 *
 * export default function Layout({ children }) {
 *   return (
 *     <>
 *       {children}
 *       <PromoPopupExample />
 *     </>
 *   );
 * }
 */
