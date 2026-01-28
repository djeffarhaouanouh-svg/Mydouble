'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Diamond } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface PromoPopupProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  badgeText?: string;
  title?: string;
  highlightedText?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  endDate?: Date;
}

export function PromoPopup({
  isOpen,
  onClose,
  imageUrl = '/avatar-1.png',
  badgeText = "Jusqu'à 70% de réduction",
  title = 'Soldes des 50M d\'utilisateurs',
  highlightedText = 'pour les Nouveaux Membres',
  subtitle = 'La réduction se termine bientôt. Ne ratez pas cette occasion.',
  ctaText = "S'abonner maintenant",
  ctaLink = '/tarification',
  endDate,
}: PromoPopupProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59,
  });

  useEffect(() => {
    if (!isOpen) return;

    const calculateTimeLeft = () => {
      if (endDate) {
        const difference = endDate.getTime() - new Date().getTime();
        if (difference > 0) {
          return {
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60),
          };
        }
      }
      // Fallback: countdown from current values
      return null;
    };

    const timer = setInterval(() => {
      const calculated = calculateTimeLeft();
      if (calculated) {
        setTimeLeft(calculated);
      } else {
        setTimeLeft((prev) => {
          let { hours, minutes, seconds } = prev;
          seconds--;
          if (seconds < 0) {
            seconds = 59;
            minutes--;
            if (minutes < 0) {
              minutes = 59;
              hours--;
              if (hours < 0) {
                hours = 23;
              }
            }
          }
          return { hours, minutes, seconds };
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, endDate]);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

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
            <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl overflow-hidden max-w-3xl w-full shadow-2xl flex flex-col md:flex-row">
              {/* Image Section */}
              <div className="relative w-full md:w-1/2 h-48 md:h-auto min-h-[250px] md:min-h-[400px]">
                <div className="absolute inset-0 bg-gradient-to-br from-[#3BB9FF]/20 to-[#e31fc1]/20" />
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt="Promotion"
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[#252525] to-[#1A1A1A] flex items-center justify-center">
                    <span className="text-6xl">🎉</span>
                  </div>
                )}
              </div>

              {/* Content Section */}
              <div className="relative w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center">
                {/* Close Button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 hover:bg-[#252525] rounded-full transition-colors z-10"
                >
                  <X className="w-5 h-5 text-[#A3A3A3] hover:text-white transition-colors" />
                </button>

                {/* Badge */}
                <span className="inline-block w-fit px-3 py-1.5 bg-gradient-to-r from-[#e31fc1] to-[#ff6b9d] text-white text-sm font-semibold rounded-full mb-4">
                  {badgeText}
                </span>

                {/* Title */}
                <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                  {title}
                </h2>
                <h3 className="text-2xl md:text-3xl font-bold text-[#3BB9FF] mb-4">
                  {highlightedText}
                </h3>

                {/* Subtitle */}
                <p className="text-[#A3A3A3] text-sm md:text-base mb-6">
                  {subtitle}
                </p>

                {/* Countdown Timer */}
                <div className="bg-[#252525] rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-[#A3A3A3] text-xs uppercase tracking-wider">fin:</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-white">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl md:text-4xl font-bold text-[#e31fc1]">
                        {formatNumber(timeLeft.hours)}
                      </span>
                      <span className="text-sm text-[#A3A3A3]">h</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl md:text-4xl font-bold text-[#e31fc1]">
                        {formatNumber(timeLeft.minutes)}
                      </span>
                      <span className="text-sm text-[#A3A3A3]">min</span>
                    </div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl md:text-4xl font-bold text-[#e31fc1]">
                        {formatNumber(timeLeft.seconds)}
                      </span>
                      <span className="text-sm text-[#A3A3A3]">sec</span>
                    </div>
                  </div>
                </div>

                {/* CTA Button */}
                <Link
                  href={ctaLink}
                  onClick={onClose}
                  className="flex items-center justify-center gap-2 w-full py-4 bg-gradient-to-r from-[#e31fc1] to-[#ff6b9d] text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-all hover:shadow-lg hover:shadow-[#e31fc1]/30"
                >
                  <Diamond className="w-5 h-5" />
                  {ctaText}
                </Link>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
