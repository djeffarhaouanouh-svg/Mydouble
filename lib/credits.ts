// Configuration des plans et crédits MyDouble

export const CREDIT_CONFIG = {
  // Crédits par plan
  plans: {
    free: {
      name: 'Gratuit',
      monthlyCredits: 5,
      signupBonus: 3,
      priceMonthly: 0,
      features: [
        '5 vidéos par mois',
        'Résolution 480p',
        'Support standard',
      ],
    },
    premium: {
      name: 'Premium',
      monthlyCredits: 50,
      signupBonus: 0,
      priceMonthly: 9.97,
      features: [
        '50 vidéos par mois',
        'Résolution 720p',
        'Support prioritaire',
        'Accès aux nouvelles fonctionnalités',
      ],
    },
    pro: {
      name: 'Pro',
      monthlyCredits: 200,
      signupBonus: 0,
      priceMonthly: 29.97,
      features: [
        '200 vidéos par mois',
        'Résolution 1080p',
        'Support VIP',
        'API access',
        'Personnages illimités',
      ],
    },
  },

  // Coût en crédits par opération
  costs: {
    videoGeneration480p: 1,
    videoGeneration720p: 2,
    videoGeneration1080p: 3,
  },

  // Types de transactions
  transactionTypes: {
    SIGNUP_BONUS: 'signup_bonus',
    SUBSCRIPTION_REFILL: 'subscription_refill',
    VIDEO_GENERATION: 'video_generation',
    PURCHASE: 'purchase',
    ADMIN_ADJUSTMENT: 'admin_adjustment',
    PROMO_CODE: 'promo_code',
  },
} as const;

export type PlanType = keyof typeof CREDIT_CONFIG.plans;
export type TransactionType = typeof CREDIT_CONFIG.transactionTypes[keyof typeof CREDIT_CONFIG.transactionTypes];

// Helper pour obtenir le coût d'une vidéo selon la résolution
export function getVideoCost(resolution: '480p' | '720p' | '1080p' = '480p'): number {
  switch (resolution) {
    case '1080p':
      return CREDIT_CONFIG.costs.videoGeneration1080p;
    case '720p':
      return CREDIT_CONFIG.costs.videoGeneration720p;
    default:
      return CREDIT_CONFIG.costs.videoGeneration480p;
  }
}

// Helper pour obtenir les infos d'un plan
export function getPlanConfig(plan: PlanType) {
  return CREDIT_CONFIG.plans[plan] || CREDIT_CONFIG.plans.free;
}
