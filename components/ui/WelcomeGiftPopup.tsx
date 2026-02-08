'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Sparkles } from 'lucide-react';

interface WelcomeGiftPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

// Function to play a welcoming jingle
const playWelcomeJingle = () => {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    const notes = [
      { freq: 523.25, start: 0, duration: 0.12 },
      { freq: 659.25, start: 0.1, duration: 0.12 },
      { freq: 783.99, start: 0.2, duration: 0.2 },
    ];

    notes.forEach(note => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime + note.start);

      gainNode.gain.setValueAtTime(0, audioContext.currentTime + note.start);
      gainNode.gain.linearRampToValueAtTime(0.25, audioContext.currentTime + note.start + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + note.start + note.duration);

      oscillator.start(audioContext.currentTime + note.start);
      oscillator.stop(audioContext.currentTime + note.start + note.duration + 0.1);
    });
  } catch {
    // Audio not supported
  }
};

export function WelcomeGiftPopup({ isOpen, onClose }: WelcomeGiftPopupProps) {
  const [hasPlayedSound, setHasPlayedSound] = useState(false);

  useEffect(() => {
    if (isOpen && !hasPlayedSound) {
      playWelcomeJingle();
      setHasPlayedSound(true);
    }
  }, [isOpen, hasPlayedSound]);

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
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden max-w-md w-full shadow-2xl">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-[#252525] rounded-full transition-colors z-10"
              >
                <X className="w-5 h-5 text-[#A3A3A3] hover:text-white transition-colors" />
              </button>

              {/* Gift animation header */}
              <div className="relative bg-gradient-to-br from-[#3BB9FF]/20 to-[#2FA9F2]/10 p-8 flex justify-center">
                <motion.div
                  animate={{
                    y: [0, -8, 0],
                    rotate: [0, -5, 5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                  className="relative"
                >
                  <div className="w-24 h-24 bg-gradient-to-br from-[#3BB9FF] to-[#2FA9F2] rounded-2xl flex items-center justify-center shadow-lg shadow-[#3BB9FF]/30">
                    <Gift className="w-12 h-12 text-white" />
                  </div>
                  {/* Sparkles */}
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="absolute -top-2 -right-2"
                  >
                    <Sparkles className="w-6 h-6 text-[#3BB9FF]" />
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    className="absolute -bottom-1 -left-2"
                  >
                    <Sparkles className="w-5 h-5 text-[#3BB9FF]" />
                  </motion.div>
                </motion.div>
              </div>

              {/* Content */}
              <div className="p-6 text-center">
                <h2 className="text-2xl font-bold text-white mb-2">
                  Bienvenue sur <span className="text-[#3BB9FF]">Swayco.ai</span> !
                </h2>
                <p className="text-[#A3A3A3] mb-6">
                  On t'offre des credits pour decouvrir le site
                </p>

                {/* Reward highlight */}
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="bg-[#252525] border border-[#3BB9FF]/30 rounded-xl p-4 mb-6"
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className="text-4xl font-bold text-[#3BB9FF]">3</span>
                    <span className="text-xl text-white font-semibold">credits offerts</span>
                  </div>
                  <p className="text-[#6B7280] text-sm">
                    1 credit = 1 video generee
                  </p>
                </motion.div>

                {/* CTA Button */}
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-[#3BB9FF] to-[#2FA9F2] text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-[#3BB9FF]/30 transition-all"
                >
                  Commencer
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
