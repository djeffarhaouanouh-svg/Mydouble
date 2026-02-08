'use client';

import { useState, useEffect } from 'react';
import { Coins, TrendingUp, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface CreditInfo {
  balance: number;
  totalEarned: number;
  totalUsed: number;
  plan: string;
  planName: string;
  monthlyCredits: number;
  nextRefillAt?: string | null;
  isGuest?: boolean;
}

interface CreditDisplayProps {
  compact?: boolean;
  showUpgrade?: boolean;
  className?: string;
  onCreditsLoaded?: (info: CreditInfo) => void;
}

export function CreditDisplay({
  compact = false,
  showUpgrade = true,
  className = '',
  onCreditsLoaded,
}: CreditDisplayProps) {
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCredits();
  }, []);

  const loadCredits = async () => {
    const userId = localStorage.getItem('userId');
    const isLoggedIn = userId && !userId.startsWith('user_') && !userId.startsWith('temp_') && !isNaN(Number(userId));

    if (!isLoggedIn) {
      // Visiteur non connecté : afficher les crédits guest depuis localStorage
      const guestCredits = parseInt(localStorage.getItem('guestCredits') || '0', 10);
      const guestInfo: CreditInfo = {
        balance: guestCredits,
        totalEarned: guestCredits,
        totalUsed: 0,
        plan: 'free',
        planName: 'Gratuit',
        monthlyCredits: 0,
        isGuest: true,
      };
      setCreditInfo(guestInfo);
      onCreditsLoaded?.(guestInfo);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/credits?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setCreditInfo(data);
        onCreditsLoaded?.(data);
      }
    } catch (error) {
      console.error('Erreur chargement crédits:', error);
    } finally {
      setLoading(false);
    }
  };

  // Recharger les crédits (exposé pour les composants parents)
  const refresh = () => {
    setLoading(true);
    loadCredits();
  };

  if (loading) {
    return (
      <div className={`animate-pulse bg-[#252525] rounded-lg h-8 w-24 ${className}`} />
    );
  }

  if (!creditInfo) {
    return null;
  }

  if (creditInfo.isGuest) {
    if (compact) {
      return (
        <div className={`flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-1.5 ${className}`}>
          <Coins className="w-4 h-4 text-[#3BB9FF]" />
          <span className="text-white font-semibold">{creditInfo.balance}</span>
          <span className="text-[#A3A3A3] text-sm">crédits</span>
        </div>
      );
    }
    return null;
  }

  if (compact) {
    return (
      <div className={`flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-lg px-3 py-1.5 ${className}`}>
        <Coins className="w-4 h-4 text-[#3BB9FF]" />
        <span className="text-white font-semibold">{creditInfo.balance}</span>
        <span className="text-[#A3A3A3] text-sm">crédits</span>
      </div>
    );
  }

  return (
    <div className={`bg-[#1A1A1A] border border-[#2A2A2A] rounded-2xl p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-[#3BB9FF]" />
          <span className="font-semibold text-white">Mes Crédits</span>
        </div>
        <span className="text-xs text-[#A3A3A3] bg-[#252525] px-2 py-1 rounded-full">
          {creditInfo.planName}
        </span>
      </div>

      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-3xl font-bold text-[#3BB9FF]">{creditInfo.balance}</span>
        <span className="text-[#A3A3A3]">/ {creditInfo.monthlyCredits} par mois</span>
      </div>

      {creditInfo.nextRefillAt && (
        <div className="flex items-center gap-1 text-xs text-[#A3A3A3] mb-3">
          <RefreshCw className="w-3 h-3" />
          <span>Recharge le {new Date(creditInfo.nextRefillAt).toLocaleDateString('fr-FR')}</span>
        </div>
      )}

      {showUpgrade && creditInfo.plan === 'free' && (
        <Link
          href="/tarification"
          className="flex items-center justify-center gap-2 w-full py-2 bg-gradient-to-r from-[#3BB9FF] to-[#2FA9F2] text-white rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <TrendingUp className="w-4 h-4" />
          Passer Premium
        </Link>
      )}
    </div>
  );
}

// Export de la fonction refresh pour utilisation externe
export function useCreditRefresh() {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = () => setRefreshKey(k => k + 1);

  return { refreshKey, triggerRefresh };
}
