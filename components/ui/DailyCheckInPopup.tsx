'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift, Check, Coins } from 'lucide-react';

// Function to play a celebratory jingle using Web Audio API
const playRewardJingle = () => {
  try {
    const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();

    // Notes for a happy jingle (C5, E5, G5, C6)
    const notes = [
      { freq: 523.25, start: 0, duration: 0.15 },      // C5
      { freq: 659.25, start: 0.12, duration: 0.15 },   // E5
      { freq: 783.99, start: 0.24, duration: 0.15 },   // G5
      { freq: 1046.50, start: 0.36, duration: 0.3 },   // C6 (longer)
    ];

    notes.forEach(note => {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime + note.start);

      // Envelope for smooth sound
      gainNode.gain.setValueAtTime(0, audioContext.currentTime + note.start);
      gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + note.start + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + note.start + note.duration);

      oscillator.start(audioContext.currentTime + note.start);
      oscillator.stop(audioContext.currentTime + note.start + note.duration + 0.1);
    });

    // Add a sparkle effect
    setTimeout(() => {
      const sparkle = audioContext.createOscillator();
      const sparkleGain = audioContext.createGain();
      sparkle.connect(sparkleGain);
      sparkleGain.connect(audioContext.destination);
      sparkle.type = 'sine';
      sparkle.frequency.setValueAtTime(2093, audioContext.currentTime); // High C
      sparkleGain.gain.setValueAtTime(0.15, audioContext.currentTime);
      sparkleGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      sparkle.start();
      sparkle.stop(audioContext.currentTime + 0.3);
    }, 500);
  } catch (e) {
    console.log('Audio not supported');
  }
};

interface DailyCheckInPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onCreditsAdded?: (amount: number) => void;
}

interface CheckInData {
  lastCheckInDate: string | null; // Format: YYYY-MM-DD (date only, no time)
  streak: number;
}

const DAILY_REWARDS = [
  { day: 1, credits: 2 },
  { day: 2, credits: 3 },
  { day: 3, credits: 4 },
  { day: 4, credits: 5 },
  { day: 5, credits: 6 },
  { day: 6, credits: 7 },
];

// Helper to get today's date as YYYY-MM-DD string (local timezone)
const getTodayDateString = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Helper to get yesterday's date as YYYY-MM-DD string (local timezone)
const getYesterdayDateString = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
};

export function DailyCheckInPopup({
  isOpen,
  onClose,
  onCreditsAdded,
}: DailyCheckInPopupProps) {
  const [checkInData, setCheckInData] = useState<CheckInData>({
    lastCheckInDate: null,
    streak: 0,
  });
  const [claimedToday, setClaimedToday] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [earnedCredits, setEarnedCredits] = useState(0);
  const [animatingDay, setAnimatingDay] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadCheckInData();
    }
  }, [isOpen]);

  const loadCheckInData = () => {
    const stored = localStorage.getItem('dailyCheckIn');
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    if (!stored) {
      // No data: fresh user, start at streak 0
      setCheckInData({ lastCheckInDate: null, streak: 0 });
      setClaimedToday(false);
      return;
    }

    try {
      const data = JSON.parse(stored);

      // Handle old format migration (lastCheckIn -> lastCheckInDate)
      let lastDate = data.lastCheckInDate;
      if (!lastDate && data.lastCheckIn) {
        // Migrate from old ISO format to YYYY-MM-DD
        const oldDate = new Date(data.lastCheckIn);
        lastDate = `${oldDate.getFullYear()}-${String(oldDate.getMonth() + 1).padStart(2, '0')}-${String(oldDate.getDate()).padStart(2, '0')}`;
      }

      // Check if already claimed today
      if (lastDate === today) {
        setCheckInData({ lastCheckInDate: lastDate, streak: data.streak || 0 });
        setClaimedToday(true);
        return;
      }

      // Check if streak continues (claimed yesterday)
      if (lastDate === yesterday) {
        // Continue streak from where it was
        setCheckInData({ lastCheckInDate: lastDate, streak: data.streak || 0 });
        setClaimedToday(false);
      } else {
        // More than 1 day gap: reset streak to 0
        setCheckInData({ lastCheckInDate: null, streak: 0 });
        setClaimedToday(false);
      }
    } catch {
      // Invalid JSON: reset
      setCheckInData({ lastCheckInDate: null, streak: 0 });
      setClaimedToday(false);
    }
  };

  const handleClaim = async () => {
    // Prevent double claiming
    if (claiming || claimedToday) return;

    // Double-check localStorage to prevent race conditions
    const stored = localStorage.getItem('dailyCheckIn');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        const today = getTodayDateString();
        const lastDate = data.lastCheckInDate || (data.lastCheckIn ? new Date(data.lastCheckIn).toISOString().split('T')[0] : null);
        if (lastDate === today) {
          setClaimedToday(true);
          return; // Already claimed today!
        }
      } catch {
        // Continue if parsing fails
      }
    }

    const userId = localStorage.getItem('userId');
    if (!userId || userId.startsWith('user_') || userId.startsWith('temp_')) {
      window.location.href = '/connexion';
      return;
    }

    setClaiming(true);
    const newStreak = checkInData.streak + 1;
    const dayIndex = Math.min(newStreak, 6);

    setAnimatingDay(dayIndex);

    try {
      const response = await fetch('/api/credits/daily-checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          streakDay: newStreak,
        }),
      });

      if (response.ok) {
        const data = await response.json();

        // Play celebration jingle
        playRewardJingle();

        // Update local storage with new format
        const today = getTodayDateString();
        const newCheckInData: CheckInData = {
          lastCheckInDate: today,
          streak: newStreak > 6 ? 6 : newStreak,
        };
        localStorage.setItem('dailyCheckIn', JSON.stringify(newCheckInData));
        setCheckInData(newCheckInData);
        setClaimedToday(true);

        setEarnedCredits(data.creditsAdded);
        setShowSuccess(true);
        onCreditsAdded?.(data.creditsAdded);

        // Close after animation
        setTimeout(() => {
          setShowSuccess(false);
          onClose();
        }, 2500);
      }
    } catch (error) {
      console.error('Erreur check-in:', error);
    } finally {
      setClaiming(false);
      setTimeout(() => setAnimatingDay(null), 600);
    }
  };

  const getCurrentDay = () => {
    if (claimedToday) {
      return checkInData.streak;
    }
    return checkInData.streak + 1;
  };

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
              {/* Header */}
              <div className="relative p-6 pb-4">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-[#252525] rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-[#A3A3A3] hover:text-white transition-colors" />
                </button>

                <h2 className="text-2xl font-bold text-[#3BB9FF] text-center mb-2">
                  Bonus Quotidien
                </h2>
                <p className="text-[#A3A3A3] text-sm text-center">
                  Connectez-vous <span className="text-[#3BB9FF] font-semibold">chaque jour</span> pour gagner des credits.
                </p>
                <p className="text-[#6B7280] text-xs text-center mt-1">
                  Votre serie se reinitialise si vous manquez un jour.
                </p>
              </div>

              {/* Rewards Grid */}
              <div className="px-6 pb-4">
                <div className="grid grid-cols-3 gap-3">
                  {DAILY_REWARDS.map((reward, index) => {
                    const currentDay = getCurrentDay();
                    const isPast = checkInData.streak >= reward.day || (claimedToday && checkInData.streak >= reward.day);
                    const isCurrent = reward.day === currentDay && !claimedToday;
                    const isAnimating = animatingDay === reward.day;

                    return (
                      <motion.div
                        key={reward.day}
                        animate={isAnimating ? {
                          scale: [1, 1.2, 1],
                          rotate: [0, -10, 10, 0],
                        } : {}}
                        transition={{ duration: 0.5 }}
                        className={`
                          relative p-4 rounded-xl border-2 transition-all
                          ${isPast
                            ? 'bg-[#3BB9FF]/20 border-[#3BB9FF]'
                            : isCurrent
                              ? 'bg-[#252525] border-[#3BB9FF] shadow-lg shadow-[#3BB9FF]/20'
                              : 'bg-[#1E1E1E] border-[#2A2A2A]'
                          }
                        `}
                      >
                        {/* Check mark for claimed days */}
                        {isPast && (
                          <div className="absolute -top-1 -right-1 bg-[#3BB9FF] rounded-full p-0.5">
                            <Check className="w-3 h-3 text-black" />
                          </div>
                        )}

                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <Coins className={`w-4 h-4 ${isPast || isCurrent ? 'text-[#3BB9FF]' : 'text-[#6B7280]'}`} />
                            <span className={`text-lg font-bold ${isPast || isCurrent ? 'text-white' : 'text-[#6B7280]'}`}>
                              {reward.credits}
                            </span>
                          </div>
                          <span className={`text-xs ${isPast || isCurrent ? 'text-[#A3A3A3]' : 'text-[#4A4A4A]'}`}>
                            {reward.day === 6 ? 'Jour 6+' : `Jour ${reward.day}`}
                          </span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* Claim Button */}
              <div className="p-6 pt-2">
                {showSuccess ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-3 py-4"
                  >
                    <motion.div
                      animate={{
                        scale: [1, 1.3, 1],
                        rotate: [0, 360],
                      }}
                      transition={{ duration: 0.8 }}
                      className="w-16 h-16 bg-gradient-to-br from-[#3BB9FF] to-[#2FA9F2] rounded-full flex items-center justify-center"
                    >
                      <Gift className="w-8 h-8 text-white" />
                    </motion.div>
                    <div className="text-center">
                      <p className="text-white font-semibold text-lg">Felicitations !</p>
                      <p className="text-[#3BB9FF] font-bold text-2xl">+{earnedCredits} credits</p>
                    </div>
                  </motion.div>
                ) : claimedToday ? (
                  <div className="flex items-center justify-center gap-2 w-full py-4 bg-[#252525] text-[#6B7280] rounded-xl font-semibold">
                    <Check className="w-5 h-5" />
                    Deja reclame aujourd&apos;hui
                  </div>
                ) : (
                  <motion.button
                    onClick={handleClaim}
                    disabled={claiming}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-3 w-full py-4 bg-gradient-to-r from-[#3BB9FF] to-[#2FA9F2] text-white rounded-xl font-semibold text-lg hover:shadow-lg hover:shadow-[#3BB9FF]/30 transition-all disabled:opacity-70"
                  >
                    {claiming ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <motion.div
                          animate={{
                            rotate: [0, -15, 15, -15, 15, 0],
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            repeatDelay: 1,
                          }}
                        >
                          <Gift className="w-6 h-6" />
                        </motion.div>
                        Reclamer +{DAILY_REWARDS[Math.min(getCurrentDay(), 6) - 1]?.credits || 2} credits
                      </>
                    )}
                  </motion.button>
                )}
              </div>

              {/* Streak Info */}
              <div className="px-6 pb-6">
                <div className="bg-[#252525] rounded-lg p-3 flex items-center justify-between">
                  <span className="text-[#A3A3A3] text-sm">Serie actuelle</span>
                  <span className="text-[#3BB9FF] font-bold">
                    {checkInData.streak} jour{checkInData.streak > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
