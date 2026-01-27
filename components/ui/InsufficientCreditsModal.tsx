'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Coins, X } from 'lucide-react';
import Link from 'next/link';

interface InsufficientCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  required: number;
}

export function InsufficientCreditsModal({
  isOpen,
  onClose,
  currentBalance,
  required,
}: InsufficientCreditsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-6 max-w-sm w-full shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="font-semibold">Crédits insuffisants</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-[#252525] rounded transition-colors"
                >
                  <X className="w-5 h-5 text-[#A3A3A3]" />
                </button>
              </div>

              {/* Message */}
              <p className="text-[#A3A3A3] mb-4">
                Vous n'avez pas assez de crédits pour générer cette vidéo.
              </p>

              {/* Balance Info */}
              <div className="bg-[#252525] rounded-lg p-3 mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-[#A3A3A3]">Solde actuel</span>
                  <span className="text-white font-semibold">{currentBalance} crédit{currentBalance > 1 ? 's' : ''}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#A3A3A3]">Requis</span>
                  <span className="text-amber-400 font-semibold">{required} crédit{required > 1 ? 's' : ''}</span>
                </div>
                {currentBalance < required && (
                  <div className="flex justify-between mt-2 pt-2 border-t border-[#3A3A3A]">
                    <span className="text-[#A3A3A3]">Manquant</span>
                    <span className="text-red-400 font-semibold">{required - currentBalance} crédit{(required - currentBalance) > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Link
                  href="/tarification"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#3BB9FF] to-[#2FA9F2] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
                >
                  <Coins className="w-4 h-4" />
                  Obtenir plus de crédits
                </Link>
                <button
                  onClick={onClose}
                  className="w-full py-2 text-[#A3A3A3] hover:text-white transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
