"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { X, User, Mail, Lock, ArrowRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import type { Trait, Enneagram, Advice, Diagnostic } from "@/lib/types";

// Textes pré-définis pour chaque type d'ennéagramme
const enneagramTexts: Record<number, { defauts: string; enfance: string }> = {
  1: {
    defauts: "Les défauts typiques de ce type incluent une tendance à l'autocritique excessive, à la rigidité et au perfectionnisme. Le type 1 peut avoir du mal à se détendre et à accepter l'imperfection, chez lui comme chez les autres.",
    enfance: "Le type 1 se développe souvent dans un environnement où l'on valorise fortement les règles, la morale et le sens du devoir. L'enfant apprend tôt qu'il doit être \"sage\" et irréprochable pour être aimé et reconnu."
  },
  2: {
    defauts: "Le type 2 peut devenir dépendant du regard des autres, se sacrifier excessivement et avoir du mal à poser des limites. Il risque aussi d'attendre inconsciemment de la reconnaissance en échange de son aide.",
    enfance: "Souvent, l'enfant apprend qu'il reçoit de l'amour surtout lorsqu'il s'occupe des autres. Il développe alors une stratégie basée sur le don de soi pour se sentir indispensable et aimé."
  },
  3: {
    defauts: "Les défauts typiques de ce type incluent une tendance à se définir uniquement par la réussite, à cacher ses émotions et à rechercher la validation extérieure. Le type 3 peut perdre contact avec sa vraie identité.",
    enfance: "Le type 3 grandit souvent dans un contexte où la réussite est fortement valorisée. Il comprend très tôt qu'il est aimé pour ce qu'il accomplit, pas forcément pour ce qu'il est."
  },
  4: {
    defauts: "Le type 4 peut s'enfermer dans la comparaison, le sentiment de manque et la mélancolie. Il a parfois tendance à dramatiser ses émotions et à se sentir incompris.",
    enfance: "Souvent, l'enfant a le sentiment d'être différent ou mis à l'écart. Il développe une identité basée sur l'originalité et la profondeur émotionnelle pour donner du sens à ce sentiment de décalage."
  },
  5: {
    defauts: "Le type 5 peut devenir distant, trop dans l'analyse et éviter l'implication émotionnelle. Il a parfois du mal à demander de l'aide et à se sentir en sécurité dans la relation.",
    enfance: "L'enfant apprend souvent à se replier sur lui-même pour se protéger. Il développe l'idée que comprendre le monde est plus sûr que s'y exposer émotionnellement."
  },
  6: {
    defauts: "Le type 6 peut être envahi par le doute, l'anxiété et la méfiance. Il oscille souvent entre besoin de sécurité et peur de l'autorité.",
    enfance: "Le type 6 se développe fréquemment dans un climat d'incertitude ou d'instabilité. L'enfant apprend à anticiper les dangers et à chercher des figures rassurantes pour se sentir en sécurité."
  },
  7: {
    defauts: "Le type 7 a tendance à fuir la frustration, éviter les émotions difficiles et se disperser. Il peut avoir du mal à rester engagé quand les choses deviennent inconfortables.",
    enfance: "L'enfant apprend à se protéger de la souffrance en cherchant constamment le plaisir et la nouveauté. Il développe une stratégie basée sur l'optimisme pour ne pas ressentir le manque."
  },
  8: {
    defauts: "Le type 8 peut devenir excessivement dominant, impulsif et dans le contrôle. Il a parfois du mal à montrer sa vulnérabilité et à faire confiance.",
    enfance: "Souvent confronté tôt à l'injustice ou à la dureté, l'enfant apprend à être fort pour survivre. Il développe une posture de protection et de puissance pour ne plus jamais être vulnérable."
  },
  9: {
    defauts: "Le type 9 peut s'oublier lui-même, éviter les conflits et avoir du mal à affirmer ses besoins. Il risque de tomber dans la passivité et l'inaction.",
    enfance: "L'enfant comprend que rester calme et ne pas faire de vagues est un moyen d'obtenir la paix. Il développe une stratégie d'effacement pour maintenir l'harmonie autour de lui."
  }
};

export default function CartePage() {
  const [messagesCount, setMessagesCount] = useState(0);
  const [adviceExpanded, setAdviceExpanded] = useState(false);
  const [enneagramExpanded, setEnneagramExpanded] = useState(false);
  const [overlayCard, setOverlayCard] = useState<'traits' | 'enneagram' | null>(null);
  const [traits, setTraits] = useState<Trait[]>([]);
  const [enneaProfile, setEnneaProfile] = useState<Enneagram | null>(null);
  const [advice, setAdvice] = useState<Advice[]>([]);
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(true);
  const [hasDoubleIA, setHasDoubleIA] = useState(false);
  const [selectedEnneagramPoint, setSelectedEnneagramPoint] = useState<number | null>(null);


  const [showInscription, setShowInscription] = useState(true); // Bloquer par défaut jusqu'à vérification

  useEffect(() => {
    loadDiagnostic();
    loadMessagesCount();
    
    // Recharger le diagnostic toutes les 30 secondes pour voir les mises à jour
    const interval = setInterval(() => {
      loadDiagnostic();
      loadMessagesCount();
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, []);

  const loadDiagnostic = async () => {
    try {
      const userId = localStorage.getItem('userId');
      
      // Vérifier si le userId est valide (doit être un nombre, pas user_ ou temp_)
      if (!userId || 
          userId.startsWith('user_') || 
          userId.startsWith('temp_') ||
          isNaN(Number(userId))) {
        setShowInscription(true);
        setLoading(false);
        return;
      }

      // Utilisateur connecté avec un compte valide, autoriser l'accès
      setShowInscription(false);

      // Charger le double IA avec son diagnostic
      const response = await fetch(`/api/double-ia/get?userId=${userId}`);
      
      if (response.status === 404) {
        // Pas de double IA créé - réinitialiser tout à vide
        setHasDoubleIA(false);
        setTraits([]);
        setEnneaProfile(null);
        setAdvice([]);
        setSummary("");
        setLoading(false);
        return;
      }
      
      if (!response.ok) {
        throw new Error('Erreur de chargement');
      }
      
      const data = await response.json();
      const double = data.double;

      if (!double) {
        // Pas de double IA
        setHasDoubleIA(false);
        setTraits([]);
        setEnneaProfile(null);
        setAdvice([]);
        setSummary("");
        setLoading(false);
        return;
      }

      setHasDoubleIA(true);

      if (double?.diagnostic) {
        const diagnostic = double.diagnostic as Diagnostic;
        
        // Mettre à jour les états avec les données du diagnostic
        if (diagnostic.traits && diagnostic.traits.length > 0) {
          setTraits(diagnostic.traits);
        } else {
          setTraits([]);
        }
        if (diagnostic.enneagram) {
          // S'assurer que type est un nombre
          const enneagram = diagnostic.enneagram;
          const enneagramType = typeof enneagram.type === 'string' ? parseInt(enneagram.type, 10) : Number(enneagram.type);
          
          // Remplir les champs defauts et enfance s'ils manquent, en utilisant les textes pré-définis
          const predefinedTexts = enneagramType && enneagramTexts[enneagramType] 
            ? enneagramTexts[enneagramType] 
            : { defauts: '', enfance: '' };
          
          const normalizedEnneagram = {
            ...enneagram,
            type: enneagramType,
            defauts: enneagram.defauts || predefinedTexts.defauts,
            enfance: enneagram.enfance || predefinedTexts.enfance,
          };
          console.log('[CARTE] Ennéagramme chargé:', normalizedEnneagram);
          console.log('[CARTE] Type:', normalizedEnneagram.type, 'Type:', typeof normalizedEnneagram.type);
          setEnneaProfile(normalizedEnneagram);
        } else {
          setEnneaProfile(null);
        }
        if (diagnostic.advice && diagnostic.advice.length > 0) {
          setAdvice(diagnostic.advice);
        } else {
          setAdvice([]);
        }
        if (diagnostic.summary) {
          setSummary(diagnostic.summary);
        } else {
          setSummary("");
        }
      } else {
        // Double IA existe mais pas encore de diagnostic (pas de messages)
        setTraits([]);
        setEnneaProfile(null);
        setAdvice([]);
        setSummary("");
      }
    } catch (error) {
      console.error('Erreur lors du chargement du diagnostic:', error);
      // Réinitialiser à vide en cas d'erreur
      setHasDoubleIA(false);
      setTraits([]);
      setEnneaProfile(null);
      setAdvice([]);
      setSummary("");
    } finally {
      setLoading(false);
    }
  };

  const loadMessagesCount = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        return;
      }

      const response = await fetch(`/api/user/profile?userId=${userId}`);
      if (!response.ok) throw new Error('Erreur de chargement');
      
      const data = await response.json();
      setMessagesCount(data.user?.messagesCount || 0);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const statRefs = useRef<(HTMLDivElement | null)[]>([]);
  const overlayStatRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Effet pour fermer la bulle en cliquant en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectedEnneagramPoint) {
        const target = event.target as HTMLElement;
        // Ne pas fermer si on clique sur un cercle de l'ennéagramme
        if (!target.closest('.ennea-circle') && !target.closest('.absolute.bg-white.rounded-xl')) {
          setSelectedEnneagramPoint(null);
        }
      }
    };

    if (selectedEnneagramPoint) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [selectedEnneagramPoint]);

  // Fermer la bulle quand l'overlay se ferme
  useEffect(() => {
    if (!overlayCard) {
      setSelectedEnneagramPoint(null);
    }
  }, [overlayCard]);

  // Fonction pour nettoyer les descriptions des références aux ailes
  const cleanEnneagramDescription = (desc: string): string => {
    if (!desc) return desc;
    // Supprimer les références aux ailes dans le texte
    return desc
      .replace(/ton aile \d+ [^\.]+\./gi, '')
      .replace(/ton aile \d+/gi, '')
      .replace(/l'aile \d+ [^\.]+\./gi, '')
      .replace(/l'aile \d+/gi, '')
      .replace(/aile \d+ [^\.]+\./gi, '')
      .replace(/aile \d+/gi, '')
      .replace(/mais ton aile/gi, '')
      .replace(/mais l'aile/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Fonction pour nettoyer le nom du type (supprimer les références au wing)
  const cleanEnneagramName = (name: string): string => {
    if (!name) return name;
    // Supprimer les références au wing dans le nom (ex: "Le Médiateur-Perfectionniste" -> "Le Médiateur")
    return name.split('-')[0]?.trim() || name;
  };

  // Fonction pour obtenir les informations d'un type d'ennéagramme
  const getEnneagramTypeInfo = (type: number) => {
    const types: Record<number, { name: string; description: string }> = {
      1: {
        name: "Le Perfectionniste",
        description: "Les personnes de type 1 sont idéalistes, rationnelles, organisées et perfectionnistes. Elles cherchent à améliorer le monde et ont un fort sens du bien et du mal."
      },
      2: {
        name: "L'Aidant",
        description: "Les personnes de type 2 sont chaleureuses, généreuses et attentionnées. Elles aiment aider les autres et ont besoin de se sentir appréciées et aimées."
      },
      3: {
        name: "Le Battant",
        description: "Les personnes de type 3 sont ambitieuses, compétitives et orientées vers le succès. Elles sont motivées par l'accomplissement et veulent être admirées."
      },
      4: {
        name: "L'Individualiste",
        description: "Les personnes de type 4 sont créatives, expressives et émotionnelles. Elles cherchent à être uniques et authentiques, et sont souvent introspectives."
      },
      5: {
        name: "L'Investigateur",
        description: "Les personnes de type 5 sont analytiques, indépendantes et intellectuelles. Elles aiment comprendre le monde et ont besoin de temps seul pour réfléchir."
      },
      6: {
        name: "Le Loyaliste",
        description: "Les personnes de type 6 sont loyales, responsables et anxieuses. Elles cherchent la sécurité et le soutien, et peuvent être très dévouées à leur groupe."
      },
      7: {
        name: "L'Enthousiaste",
        description: "Les personnes de type 7 sont spontanées, optimistes et aventureuses. Elles aiment explorer de nouvelles possibilités et éviter la douleur ou l'ennui."
      },
      8: {
        name: "Le Challenger",
        description: "Les personnes de type 8 sont confiantes, assertives et protectrices. Elles sont des leaders naturels qui aiment prendre le contrôle et défendre les faibles."
      },
      9: {
        name: "Le Pacificateur",
        description: "Les personnes de type 9 sont paisibles, accommodantes et réceptives. Elles cherchent l'harmonie et évitent les conflits, préférant la stabilité."
      }
    };
    return types[type] || { name: "Type inconnu", description: "Information non disponible" };
  };

  // Fonction pour obtenir la position d'un point de l'ennéagramme (en pourcentage)
  const getEnneagramPointPosition = (type: number) => {
    // Coordonnées dans le viewBox 400x400
    const positions: Record<number, { x: number; y: number; anchor: 'left' | 'right' | 'top' | 'bottom' }> = {
      9: { x: 200, y: 50, anchor: 'bottom' },   // En haut
      1: { x: 329.9, y: 79.5, anchor: 'left' }, // En haut à droite
      2: { x: 350, y: 200, anchor: 'left' },     // À droite
      3: { x: 329.9, y: 320.5, anchor: 'left' }, // En bas à droite
      4: { x: 260, y: 360, anchor: 'top' },     // En bas à droite
      5: { x: 140, y: 360, anchor: 'top' },      // En bas à gauche
      6: { x: 70.1, y: 320.5, anchor: 'right' }, // En bas à gauche
      7: { x: 50, y: 200, anchor: 'right' },     // À gauche
      8: { x: 70.1, y: 79.5, anchor: 'right' }  // En haut à gauche
    };
    return positions[type] || { x: 200, y: 200, anchor: 'bottom' };
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const statElement = entry.target as HTMLElement;
            const value = statElement.dataset.value;
            const bar = statElement.querySelector(".fill") as HTMLElement;
            const score = statElement.querySelector(".score") as HTMLElement;

            if (bar && value) {
              // Animation fluide de la barre
              bar.style.transition = "width 0.8s ease-out";
              bar.style.width = value + "%";
            }

            if (score) {
              score.classList.add("score-animate");
            }

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    // Utiliser setTimeout pour s'assurer que les refs sont attachées
    const timeoutId = setTimeout(() => {
      statRefs.current.forEach((ref) => {
        if (ref) {
          observer.observe(ref);
          // Toujours déclencher l'animation après un court délai
          const value = ref.dataset.value;
          const bar = ref.querySelector(".fill") as HTMLElement;
          if (bar && value) {
            // S'assurer que la barre commence à 0%
            bar.style.width = "0%";
            // Forcer un reflow pour que l'animation fonctionne
            void bar.offsetWidth;
            // Déclencher l'animation
            setTimeout(() => {
              bar.style.transition = "width 1.2s cubic-bezier(.22,1,.36,1)";
              bar.style.width = value + "%";
            }, 200);
          }
        }
      });
    }, 200);

    return () => {
      clearTimeout(timeoutId);
      statRefs.current.forEach((ref) => {
        if (ref) {
          observer.unobserve(ref);
        }
      });
    };
  }, [traits, loading]);

  // Effet pour animer les stats dans l'overlay
  useEffect(() => {
    if (overlayCard === 'traits') {
      // Utiliser requestAnimationFrame pour s'assurer que le DOM est prêt
      const applyStyles = () => {
        overlayStatRefs.current.forEach((ref, index) => {
          if (ref) {
            const value = ref.dataset.value;
            const bar = ref.querySelector(".fill") as HTMLElement;
            const score = ref.querySelector(".score") as HTMLElement;

            if (bar && value) {
              // Réinitialiser puis appliquer la largeur pour forcer le re-render
              bar.style.width = "0%";
              // Forcer le reflow
              void bar.offsetWidth;
              // Appliquer la largeur finale
              requestAnimationFrame(() => {
                bar.style.width = value + "%";
                bar.style.display = "block";
                bar.style.opacity = "1";
              });
            }

            if (score) {
              score.classList.add("score-animate");
            }
          }
        });
      };

      // Plusieurs tentatives pour garantir l'affichage sur mobile
      requestAnimationFrame(() => {
        setTimeout(applyStyles, 100);
        setTimeout(applyStyles, 300);
        setTimeout(applyStyles, 600);
      });
    }
  }, [overlayCard]);

  // Composant formulaire d'inscription
  const InscriptionForm = ({ redirectTo, onSuccess }: { redirectTo: string; onSuccess: () => void }) => {
    const [isLogin, setIsLogin] = useState(false);
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
    });
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setIsLoading(true);

      try {
        const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Une erreur est survenue');
        }

        if (data.userId) {
          localStorage.setItem('userId', data.userId.toString());
        }

        onSuccess();
      } catch (err: any) {
        setError(err.message || 'Une erreur est survenue');
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">
                {isLogin ? 'Connexion' : 'Inscription'}
              </h1>
              <p className="text-gray-600">
                {isLogin 
                  ? 'Connecte-toi pour voir ta carte de personnalité' 
                  : 'Crée ton compte pour découvrir ta carte de personnalité'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom complet
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      required={!isLogin}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e31fc1] focus:border-transparent"
                      placeholder="Jean Dupont"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e31fc1] focus:border-transparent"
                    placeholder="jean@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#e31fc1] focus:border-transparent"
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    {isLogin ? 'Connexion...' : 'Inscription...'}
                  </>
                ) : (
                  <>
                    {isLogin ? 'Se connecter' : "S'inscrire"}
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                }}
                className="text-sm text-[#e31fc1] hover:underline"
              >
                {isLogin 
                  ? "Pas encore de compte ? S'inscrire" 
                  : 'Déjà un compte ? Se connecter'}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  if (showInscription) {
    return <InscriptionForm redirectTo="/carte" onSuccess={() => {
      setShowInscription(false);
      loadDiagnostic();
      loadMessagesCount();
    }} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#e31fc1] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de ta carte...</p>
        </div>
      </div>
    );
  }

  // Si l'utilisateur n'a pas encore créé de double IA ou n'a pas de diagnostic
  if (!hasDoubleIA || traits.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 text-gray-900 pt-12 pb-24">
        <div className="max-w-4xl mx-auto px-4 md:px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 text-center"
          >
            <div className="mb-8">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] rounded-full flex items-center justify-center">
                <span className="text-4xl">🎯</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-black">
                Crée ton Double IA
              </h1>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                {!hasDoubleIA 
                  ? "Tu n'as pas encore créé ton double IA. Pour voir ta carte de personnalité unique, commence par créer ton double en 3 étapes simples !"
                  : "Continue à parler avec ton double IA pour générer ta carte de personnalité. Plus tu échanges de messages, plus ta carte sera précise !"}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {!hasDoubleIA && (
                <Link
                  href="/onboarding-ia"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity shadow-lg"
                >
                  <span>Créer mon Double IA</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              )}
              <Link
                href="/messages"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-[#e31fc1] text-[#e31fc1] font-semibold rounded-xl hover:bg-purple-50 transition-colors"
              >
                <span>{!hasDoubleIA ? "Voir les messages" : "Parler avec mon Double IA"}</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 text-gray-900 pt-12 pb-24">
      <div className="max-w-6xl mx-auto px-2 md:px-6">
        {/* Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:bg-white md:rounded-3xl md:shadow-2xl md:p-5 md:p-6"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl font-bold mb-2 text-black"
            >
              Ta Carte de Personnalité Unique
            </motion.h1>
            <div className="max-w-xs md:max-w-md mx-auto mt-4">
              <p className="text-gray-700 text-sm mb-2 text-center">
                Continue à parler avec ton double, pour plus de précision !
              </p>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.max(Math.min((messagesCount / 100) * 100, 80), 5)}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
                  />
                </div>
                <span className="text-purple-600 font-semibold text-sm whitespace-nowrap">
                  {Math.max(5, Math.min(Math.round((messagesCount / 100) * 100), 80))}%
                </span>
              </div>
            </div>
          </div>

          {/* Mobile: Cards side by side, Desktop: side by side */}
          <div className="mb-6 md:mb-6 px-2 md:px-0">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-6 items-stretch">
              {/* Stats Card - Compact on mobile */}
              <div className="relative h-full flex flex-col">
                <div 
                  className="stats-card md:h-auto h-full flex flex-col flex-1 !my-0 md:!my-[30px] cursor-pointer !p-3 md:!p-[18px]"
                  onClick={() => setOverlayCard('traits')}
                >
                  <h2 className="title text-base md:text-xl font-bold md:justify-center">
                    🏆 Traits dominants
                  </h2>

                  {traits.map((trait, index) => (
                    <div
                      key={trait.name}
                      className="stat"
                      data-value={trait.score}
                      ref={(el) => {
                        statRefs.current[index] = el;
                      }}
                    >
                      <span className="label text-sm md:text-base">{trait.name}</span>
                      <div className="bar">
                        <div className={`fill ${trait.gradient}`}></div>
                      </div>
                      <span className={`score ${trait.colorClass} text-sm md:text-base`}>{trait.score}%</span>
                    </div>
                  ))}

                  <p className="punchline text-xs md:text-sm">
                    {summary}
                  </p>
                </div>
              </div>

              {/* Enneagram Section */}
              {enneaProfile && (
              <div className="md:mb-6 bg-white rounded-2xl md:rounded-none p-2 md:p-0 border-2 md:border-0 border-gray-200 shadow-md md:shadow-none">
                <div className="hidden md:block">
                  <div className="ennea-card-container w-full">
                    <div 
                      className="ennea-card cursor-pointer"
                      onClick={() => setOverlayCard('enneagram')}
                    >
                      <div className="ennea-card-content">
                        <div className="ennea-header">
                          <div className="ennea-icon">🔮</div>
                          <h1>Ennéagramme</h1>
                        </div>

                        <div className="ennea-type-badge">
                          <div className="ennea-type-title">
                            Type <span className="ennea-type-number">{enneaProfile.type}</span> • <span className="ennea-type-name">{cleanEnneagramName(enneaProfile.name)}</span>
                          </div>
                        </div>

                        <p className="ennea-description">
                          {cleanEnneagramDescription(enneaProfile.desc)}
                        </p>

                        <div className="enneagram-container">
                          <svg viewBox="0 0 400 400">
                            <defs>
                              <linearGradient id="lineGradient" x1={"0%"} y1={"0%"} x2={"100%"} y2={"100%"}>
                                <stop offset={"0%"} style={{ stopColor: '#667eea', stopOpacity: 1 }} />
                                <stop offset={"100%"} style={{ stopColor: '#764ba2', stopOpacity: 1 }} />
                              </linearGradient>
                              
                              {/* Filtres de glow pour tous les types */}
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                                <filter key={`glow${num}`} id={`glow${num}`} x={"-50%"} y={"-50%"} width={"200%"} height={"200%"}>
                                  <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                                  <feMerge>
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                  </feMerge>
                                </filter>
                              ))}
                              
                              {/* Gradients de glow pour tous les types */}
                              <radialGradient id="glowGradient1">
                                <stop offset={"0%"} style={{ stopColor: '#f56565', stopOpacity: 0.8 }} />
                                <stop offset={"50%"} style={{ stopColor: '#f56565', stopOpacity: 0.4 }} />
                                <stop offset={"100%"} style={{ stopColor: '#f56565', stopOpacity: 0 }} />
                              </radialGradient>
                              <radialGradient id="glowGradient2">
                                <stop offset={"0%"} style={{ stopColor: '#ed8936', stopOpacity: 0.8 }} />
                                <stop offset={"50%"} style={{ stopColor: '#ed8936', stopOpacity: 0.4 }} />
                                <stop offset={"100%"} style={{ stopColor: '#ed8936', stopOpacity: 0 }} />
                              </radialGradient>
                              <radialGradient id="glowGradient3">
                                <stop offset={"0%"} style={{ stopColor: '#ffa834', stopOpacity: 0.8 }} />
                                <stop offset={"50%"} style={{ stopColor: '#ffa834', stopOpacity: 0.4 }} />
                                <stop offset={"100%"} style={{ stopColor: '#ffa834', stopOpacity: 0 }} />
                              </radialGradient>
                              <radialGradient id="glowGradient4">
                                <stop offset={"0%"} style={{ stopColor: '#f6d365', stopOpacity: 0.8 }} />
                                <stop offset={"50%"} style={{ stopColor: '#f6d365', stopOpacity: 0.4 }} />
                                <stop offset={"100%"} style={{ stopColor: '#f6d365', stopOpacity: 0 }} />
                              </radialGradient>
                              <radialGradient id="glowGradient5">
                                <stop offset={"0%"} style={{ stopColor: '#d946ef', stopOpacity: 0.8 }} />
                                <stop offset={"50%"} style={{ stopColor: '#d946ef', stopOpacity: 0.4 }} />
                                <stop offset={"100%"} style={{ stopColor: '#d946ef', stopOpacity: 0 }} />
                              </radialGradient>
                              <radialGradient id="glowGradient6">
                                <stop offset={"0%"} style={{ stopColor: '#06b6d4', stopOpacity: 0.8 }} />
                                <stop offset={"50%"} style={{ stopColor: '#06b6d4', stopOpacity: 0.4 }} />
                                <stop offset={"100%"} style={{ stopColor: '#06b6d4', stopOpacity: 0 }} />
                              </radialGradient>
                              <radialGradient id="glowGradient7">
                                <stop offset={"0%"} style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
                                <stop offset={"50%"} style={{ stopColor: '#10b981', stopOpacity: 0.4 }} />
                                <stop offset={"100%"} style={{ stopColor: '#10b981', stopOpacity: 0 }} />
                              </radialGradient>
                              <radialGradient id="glowGradient8">
                                <stop offset={"0%"} style={{ stopColor: '#3b82f6', stopOpacity: 0.8 }} />
                                <stop offset={"50%"} style={{ stopColor: '#3b82f6', stopOpacity: 0.4 }} />
                                <stop offset={"100%"} style={{ stopColor: '#3b82f6', stopOpacity: 0 }} />
                              </radialGradient>
                              <radialGradient id="glowGradient9">
                                <stop offset={"0%"} style={{ stopColor: '#8b5cf6', stopOpacity: 0.8 }} />
                                <stop offset={"50%"} style={{ stopColor: '#8b5cf6', stopOpacity: 0.4 }} />
                                <stop offset={"100%"} style={{ stopColor: '#8b5cf6', stopOpacity: 0 }} />
                              </radialGradient>
                            </defs>

                            <circle cx="200" cy="200" r="150" fill="none" stroke="#e2e8f0" strokeWidth="2"/>

                            <path className="ennea-line" d="M 200 50 L 329.9 320.5 L 70.1 320.5 Z"/>
                            <path className="ennea-line" d="M 329.9 79.5 L 329.9 320.5 M 329.9 320.5 L 70.1 320.5 M 70.1 320.5 L 70.1 79.5 M 70.1 79.5 L 200 50 M 200 50 L 329.9 79.5"/>
                            
                            {/* Cercles de glow dynamiques pour le type */}
                            {enneaProfile.type === 9 && <circle cx="200" cy="50" r="39" fill="#8b5cf6" opacity="0.7"/>}
                            {enneaProfile.type === 1 && <circle cx="329.9" cy="79.5" r="39" fill="#f56565" opacity="0.7"/>}
                            {enneaProfile.type === 2 && <circle cx="350" cy="200" r="39" fill="#ed8936" opacity="0.7"/>}
                            {enneaProfile.type === 3 && <circle cx="329.9" cy="320.5" r="39" fill="#ffa834" opacity="0.7"/>}
                            {enneaProfile.type === 4 && <circle cx="260" cy="360" r="39" fill="#f6d365" opacity="0.7"/>}
                            {enneaProfile.type === 5 && <circle cx="140" cy="360" r="39" fill="#d946ef" opacity="0.7"/>}
                            {enneaProfile.type === 6 && <circle cx="70.1" cy="320.5" r="39" fill="#06b6d4" opacity="0.7"/>}
                            {enneaProfile.type === 7 && <circle cx="50" cy="200" r="39" fill="#10b981" opacity="0.7"/>}
                            {enneaProfile.type === 8 && <circle cx="70.1" cy="79.5" r="39" fill="#3b82f6" opacity="0.7"/>}
                            
                            {/* Contours jaunes pour le type */}
                            {enneaProfile.type === 9 && (
                              <circle cx="200" cy="50" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                            )}
                            {enneaProfile.type === 1 && (
                              <circle cx="329.9" cy="79.5" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                            )}
                            {enneaProfile.type === 2 && (
                              <circle cx="350" cy="200" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                            )}
                            {enneaProfile.type === 3 && (
                              <circle cx="329.9" cy="320.5" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                            )}
                            {enneaProfile.type === 4 && (
                              <circle cx="260" cy="360" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                            )}
                            {enneaProfile.type === 5 && (
                              <circle cx="140" cy="360" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                            )}
                            {enneaProfile.type === 6 && (
                              <circle cx="70.1" cy="320.5" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                            )}
                            {enneaProfile.type === 7 && (
                              <circle cx="50" cy="200" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                            )}
                            {enneaProfile.type === 8 && (
                              <circle cx="70.1" cy="79.5" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                            )}
                            
                            <g 
                              className={`ennea-circle ${enneaProfile.type === 9 ? 'ennea-highlight highlight' : ''}`} 
                              data-point="9"
                            >
                              <circle className="ennea-point-9" cx="200" cy="50" r={enneaProfile.type === 9 ? 30 : 22}/>
                              <text className="ennea-circle-number" x="200" y="50" style={{ fontSize: enneaProfile.type === 9 ? '30px' : '24px' }}>9</text>
                            </g>
                            
                            <g 
                              className={`ennea-circle ${enneaProfile.type === 1 ? 'ennea-highlight highlight' : ''}`} 
                              data-point="1"
                            >
                              <circle className="ennea-point-1" cx="329.9" cy="79.5" r={enneaProfile.type === 1 ? 30 : 22}/>
                              <text className="ennea-circle-number" x="329.9" y="79.5" style={{ fontSize: enneaProfile.type === 1 ? '30px' : '24px' }}>1</text>
                            </g>
                            
                            <g 
                              className={`ennea-circle ${enneaProfile.type === 2 ? 'ennea-highlight highlight' : ''}`} 
                              data-point="2"
                            >
                              <circle className="ennea-point-2" cx="350" cy="200" r={enneaProfile.type === 2 ? 30 : 22}/>
                              <text className="ennea-circle-number" x="350" y="200" style={{ fontSize: enneaProfile.type === 2 ? '30px' : '24px' }}>2</text>
                            </g>
                            
                            <g 
                              className={`ennea-circle ${enneaProfile.type === 3 ? 'ennea-highlight highlight' : ''}`} 
                              data-point="3"
                            >
                              <circle className="ennea-point-3" cx="329.9" cy="320.5" r={enneaProfile.type === 3 ? 30 : 22}/>
                              <text className="ennea-circle-number" x="329.9" y="320.5" style={{ fontSize: enneaProfile.type === 3 ? '30px' : '24px' }}>3</text>
                            </g>
                            
                            <g 
                              className={`ennea-circle ${enneaProfile.type === 4 ? 'ennea-highlight highlight' : ''}`} 
                              data-point="4"
                            >
                              <circle className="ennea-point-4" cx="260" cy="360" r={enneaProfile.type === 4 ? 30 : 22}/>
                              <text className="ennea-circle-number" x="260" y="360" style={{ fontSize: enneaProfile.type === 4 ? '30px' : '24px' }}>4</text>
                            </g>
                            
                            <g 
                              className={`ennea-circle ${enneaProfile.type === 5 ? 'ennea-highlight highlight' : ''}`} 
                              data-point="5"
                            >
                              <circle className="ennea-point-5" cx="140" cy="360" r={enneaProfile.type === 5 ? 30 : 22}/>
                              <text className="ennea-circle-number" x="140" y="360" style={{ fontSize: enneaProfile.type === 5 ? '30px' : '24px' }}>5</text>
                            </g>
                            
                            <g 
                              className={`ennea-circle ${enneaProfile.type === 6 ? 'ennea-highlight highlight' : ''}`} 
                              data-point="6"
                            >
                              <circle className="ennea-point-6" cx="70.1" cy="320.5" r={enneaProfile.type === 6 ? 30 : 22}/>
                              <text className="ennea-circle-number" x="70.1" y="320.5" style={{ fontSize: enneaProfile.type === 6 ? '30px' : '24px' }}>6</text>
                            </g>
                            
                            <g 
                              className={`ennea-circle ${enneaProfile.type === 7 ? 'ennea-highlight highlight' : ''}`} 
                              data-point="7"
                            >
                              <circle className="ennea-point-7" cx="50" cy="200" r={enneaProfile.type === 7 ? 30 : 22}/>
                              <text className="ennea-circle-number" x="50" y="200" style={{ fontSize: enneaProfile.type === 7 ? '30px' : '24px' }}>7</text>
                            </g>
                            
                            <g 
                              className={`ennea-circle ${enneaProfile.type === 8 ? 'ennea-highlight highlight' : ''}`} 
                              data-point="8"
                            >
                              <circle className="ennea-point-8" cx="70.1" cy="79.5" r={enneaProfile.type === 8 ? 30 : 22}/>
                              <text className="ennea-circle-number" x="70.1" y="79.5" style={{ fontSize: enneaProfile.type === 8 ? '30px' : '24px' }}>8</text>
                            </g>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Mobile: Compact view */}
                <div 
                  className="block md:hidden w-full h-full flex flex-col cursor-pointer"
                  onClick={() => setOverlayCard('enneagram')}
                >
                  <h2 className="title text-base mb-2 flex-shrink-0 font-bold justify-center">
                    🔮 Ennéagramme
                  </h2>
                  <div className="text-center mb-3 flex-shrink-0">
                    <div className="ennea-type-badge">
                      <div className="ennea-type-title text-xs">
                        Type <span className="ennea-type-number">{enneaProfile.type}</span> • <span className="ennea-type-name">{cleanEnneagramName(enneaProfile.name)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="enneagram-container flex-shrink-0 mb-3" style={{ width: "100%", height: "200px" }}>
                    <svg viewBox="0 0 400 400" style={{ width: "100%", height: "100%" }}>
                      <defs>
                        <linearGradient id="lineGradientMobile" x1={"0%"} y1={"0%"} x2={"100%"} y2={"100%"}>
                          <stop offset={"0%"} style={{ stopColor: '#667eea', stopOpacity: 1 }} />
                          <stop offset={"100%"} style={{ stopColor: '#764ba2', stopOpacity: 1 }} />
                        </linearGradient>
                        {/* Filtres de glow pour tous les types (mobile) */}
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                          <filter key={`glow${num}Mobile`} id={`glow${num}Mobile`} x={"-50%"} y={"-50%"} width={"200%"} height={"200%"}>
                            <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                        ))}
                        {/* Gradients de glow pour tous les types (mobile) */}
                        <radialGradient id="glowGradient1Mobile">
                          <stop offset={"0%"} style={{ stopColor: '#f56565', stopOpacity: 0.8 }} />
                          <stop offset={"50%"} style={{ stopColor: '#f56565', stopOpacity: 0.4 }} />
                          <stop offset={"100%"} style={{ stopColor: '#f56565', stopOpacity: 0 }} />
                        </radialGradient>
                        <radialGradient id="glowGradient2Mobile">
                          <stop offset={"0%"} style={{ stopColor: '#ed8936', stopOpacity: 0.8 }} />
                          <stop offset={"50%"} style={{ stopColor: '#ed8936', stopOpacity: 0.4 }} />
                          <stop offset={"100%"} style={{ stopColor: '#ed8936', stopOpacity: 0 }} />
                        </radialGradient>
                        <radialGradient id="glowGradient3Mobile">
                          <stop offset={"0%"} style={{ stopColor: '#ffa834', stopOpacity: 0.8 }} />
                          <stop offset={"50%"} style={{ stopColor: '#ffa834', stopOpacity: 0.4 }} />
                          <stop offset={"100%"} style={{ stopColor: '#ffa834', stopOpacity: 0 }} />
                        </radialGradient>
                        <radialGradient id="glowGradient4Mobile">
                          <stop offset={"0%"} style={{ stopColor: '#f6d365', stopOpacity: 0.8 }} />
                          <stop offset={"50%"} style={{ stopColor: '#f6d365', stopOpacity: 0.4 }} />
                          <stop offset={"100%"} style={{ stopColor: '#f6d365', stopOpacity: 0 }} />
                        </radialGradient>
                        <radialGradient id="glowGradient5Mobile">
                          <stop offset={"0%"} style={{ stopColor: '#d946ef', stopOpacity: 0.8 }} />
                          <stop offset={"50%"} style={{ stopColor: '#d946ef', stopOpacity: 0.4 }} />
                          <stop offset={"100%"} style={{ stopColor: '#d946ef', stopOpacity: 0 }} />
                        </radialGradient>
                        <radialGradient id="glowGradient6Mobile">
                          <stop offset={"0%"} style={{ stopColor: '#06b6d4', stopOpacity: 0.8 }} />
                          <stop offset={"50%"} style={{ stopColor: '#06b6d4', stopOpacity: 0.4 }} />
                          <stop offset={"100%"} style={{ stopColor: '#06b6d4', stopOpacity: 0 }} />
                        </radialGradient>
                        <radialGradient id="glowGradient7Mobile">
                          <stop offset={"0%"} style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
                          <stop offset={"50%"} style={{ stopColor: '#10b981', stopOpacity: 0.4 }} />
                          <stop offset={"100%"} style={{ stopColor: '#10b981', stopOpacity: 0 }} />
                        </radialGradient>
                        <radialGradient id="glowGradient8Mobile">
                          <stop offset={"0%"} style={{ stopColor: '#3b82f6', stopOpacity: 0.8 }} />
                          <stop offset={"50%"} style={{ stopColor: '#3b82f6', stopOpacity: 0.4 }} />
                          <stop offset={"100%"} style={{ stopColor: '#3b82f6', stopOpacity: 0 }} />
                        </radialGradient>
                        <radialGradient id="glowGradient9Mobile">
                          <stop offset={"0%"} style={{ stopColor: '#8b5cf6', stopOpacity: 0.8 }} />
                          <stop offset={"50%"} style={{ stopColor: '#8b5cf6', stopOpacity: 0.4 }} />
                          <stop offset={"100%"} style={{ stopColor: '#8b5cf6', stopOpacity: 0 }} />
                        </radialGradient>
                      </defs>
                      <circle cx="200" cy="200" r="150" fill="none" stroke="#e2e8f0" strokeWidth="2"/>
                      <path d="M 200 50 L 329.9 320.5 L 70.1 320.5 Z" stroke="#667eea" strokeWidth="5" fill="none" opacity="1"/>
                      <path d="M 329.9 79.5 L 329.9 320.5 M 329.9 320.5 L 70.1 320.5 M 70.1 320.5 L 70.1 79.5 M 70.1 79.5 L 200 50 M 200 50 L 329.9 79.5" stroke="#667eea" strokeWidth="5" fill="none" opacity="1"/>
                      {/* Cercles de glow dynamiques pour le type (mobile) */}
                      {enneaProfile.type === 9 && <circle cx="200" cy="50" r="30" fill="#8b5cf6" opacity="0.7"/>}
                      {enneaProfile.type === 1 && <circle cx="329.9" cy="79.5" r="30" fill="#f56565" opacity="0.7"/>}
                      {enneaProfile.type === 2 && <circle cx="350" cy="200" r="30" fill="#ed8936" opacity="0.7"/>}
                      {enneaProfile.type === 3 && <circle cx="329.9" cy="320.5" r="30" fill="#ffa834" opacity="0.7"/>}
                      {enneaProfile.type === 4 && <circle cx="260" cy="360" r="30" fill="#f6d365" opacity="0.7"/>}
                      {enneaProfile.type === 5 && <circle cx="140" cy="360" r="30" fill="#d946ef" opacity="0.7"/>}
                      {enneaProfile.type === 6 && <circle cx="70.1" cy="320.5" r="30" fill="#06b6d4" opacity="0.7"/>}
                      {enneaProfile.type === 7 && <circle cx="50" cy="200" r="30" fill="#10b981" opacity="0.7"/>}
                      {enneaProfile.type === 8 && <circle cx="70.1" cy="79.5" r="30" fill="#3b82f6" opacity="0.7"/>}
                      
                      {/* Contours jaunes pour le type (mobile) */}
                      {enneaProfile.type === 9 && (
                        <circle cx="200" cy="50" r="27" fill="none" stroke="#facc15" strokeWidth="3"/>
                      )}
                      {enneaProfile.type === 1 && (
                        <circle cx="329.9" cy="79.5" r="27" fill="none" stroke="#facc15" strokeWidth="3"/>
                      )}
                      {enneaProfile.type === 2 && (
                        <circle cx="350" cy="200" r="27" fill="none" stroke="#facc15" strokeWidth="3"/>
                      )}
                      {enneaProfile.type === 3 && (
                        <circle cx="329.9" cy="320.5" r="27" fill="none" stroke="#facc15" strokeWidth="3"/>
                      )}
                      {enneaProfile.type === 4 && (
                        <circle cx="260" cy="360" r="27" fill="none" stroke="#facc15" strokeWidth="3"/>
                      )}
                      {enneaProfile.type === 5 && (
                        <circle cx="140" cy="360" r="27" fill="none" stroke="#facc15" strokeWidth="3"/>
                      )}
                      {enneaProfile.type === 6 && (
                        <circle cx="70.1" cy="320.5" r="27" fill="none" stroke="#facc15" strokeWidth="3"/>
                      )}
                      {enneaProfile.type === 7 && (
                        <circle cx="50" cy="200" r="27" fill="none" stroke="#facc15" strokeWidth="3"/>
                      )}
                      {enneaProfile.type === 8 && (
                        <circle cx="70.1" cy="79.5" r="27" fill="none" stroke="#facc15" strokeWidth="3"/>
                      )}
                      
                      <g 
                        className={`ennea-circle ${enneaProfile.type === 9 ? 'ennea-highlight highlight' : ''}`} 
                        data-point="9"
                      >
                        <circle className="ennea-point-9" cx="200" cy="50" r={enneaProfile.type === 9 ? 22 : 18}/>
                        <text className="ennea-circle-number" x="200" y="50" style={{ fontSize: enneaProfile.type === 9 ? '18px' : '14px' }}>9</text>
                      </g>
                      <g 
                        className={`ennea-circle ${enneaProfile.type === 1 ? 'ennea-highlight highlight' : ''}`} 
                        data-point="1"
                      >
                        <circle className="ennea-point-1" cx="329.9" cy="79.5" r={enneaProfile.type === 1 ? 22 : 18}/>
                        <text className="ennea-circle-number" x="329.9" y="79.5" style={{ fontSize: enneaProfile.type === 1 ? '18px' : '14px' }}>1</text>
                      </g>
                      <g 
                        className={`ennea-circle ${enneaProfile.type === 2 ? 'ennea-highlight highlight' : ''}`} 
                        data-point="2"
                      >
                        <circle className="ennea-point-2" cx="350" cy="200" r={enneaProfile.type === 2 ? 22 : 18}/>
                        <text className="ennea-circle-number" x="350" y="200" style={{ fontSize: enneaProfile.type === 2 ? '18px' : '14px' }}>2</text>
                      </g>
                      <g 
                        className={`ennea-circle ${enneaProfile.type === 3 ? 'ennea-highlight highlight' : ''}`} 
                        data-point="3"
                      >
                        <circle className="ennea-point-3" cx="329.9" cy="320.5" r={enneaProfile.type === 3 ? 22 : 18}/>
                        <text className="ennea-circle-number" x="329.9" y="320.5" style={{ fontSize: enneaProfile.type === 3 ? '18px' : '14px' }}>3</text>
                      </g>
                      <g 
                        className={`ennea-circle ${enneaProfile.type === 4 ? 'ennea-highlight highlight' : ''}`} 
                        data-point="4"
                      >
                        <circle className="ennea-point-4" cx="260" cy="360" r={enneaProfile.type === 4 ? 22 : 18}/>
                        <text className="ennea-circle-number" x="260" y="360" style={{ fontSize: enneaProfile.type === 4 ? '18px' : '14px' }}>4</text>
                      </g>
                      <g 
                        className={`ennea-circle ${enneaProfile.type === 5 ? 'ennea-highlight highlight' : ''}`} 
                        data-point="5"
                      >
                        <circle className="ennea-point-5" cx="140" cy="360" r={enneaProfile.type === 5 ? 22 : 18}/>
                        <text className="ennea-circle-number" x="140" y="360" style={{ fontSize: enneaProfile.type === 5 ? '18px' : '14px' }}>5</text>
                      </g>
                      <g 
                        className={`ennea-circle ${enneaProfile.type === 6 ? 'ennea-highlight highlight' : ''}`} 
                        data-point="6"
                      >
                        <circle className="ennea-point-6" cx="70.1" cy="320.5" r={enneaProfile.type === 6 ? 22 : 18}/>
                        <text className="ennea-circle-number" x="70.1" y="320.5" style={{ fontSize: enneaProfile.type === 6 ? '18px' : '14px' }}>6</text>
                      </g>
                      <g 
                        className={`ennea-circle ${enneaProfile.type === 7 ? 'ennea-highlight highlight' : ''}`} 
                        data-point="7"
                      >
                        <circle className="ennea-point-7" cx="50" cy="200" r={enneaProfile.type === 7 ? 22 : 18}/>
                        <text className="ennea-circle-number" x="50" y="200" style={{ fontSize: enneaProfile.type === 7 ? '18px' : '14px' }}>7</text>
                      </g>
                      <g 
                        className={`ennea-circle ${enneaProfile.type === 8 ? 'ennea-highlight highlight' : ''}`} 
                        data-point="8"
                      >
                        <circle className="ennea-point-8" cx="70.1" cy="79.5" r={enneaProfile.type === 8 ? 22 : 18}/>
                        <text className="ennea-circle-number" x="70.1" y="79.5" style={{ fontSize: enneaProfile.type === 8 ? '18px' : '14px' }}>8</text>
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

          {/* CTA Partager */}
          <div className="text-center pt-8">
            <p className="text-gray-600 mb-6">💡 Partage ta carte de personnalité avec tes amis !</p>
            <button
              onClick={async () => {
                const url = window.location.href;
                if (navigator.share) {
                  try {
                    await navigator.share({
                      title: 'Ma Carte de Personnalité Unique',
                      text: 'Découvre ma carte de personnalité créée par IA !',
                      url: url,
                    });
                  } catch (err) {
                    // L'utilisateur a annulé le partage
                  }
                } else {
                  // Fallback: copier le lien
                  try {
                    await navigator.clipboard.writeText(url);
                    alert('Lien copié dans le presse-papiers !');
                  } catch (err) {
                    alert('Impossible de partager. Veuillez copier le lien manuellement.');
                  }
                }
              }}
              className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:scale-105 hover:shadow-xl transition-all"
            >
              Partager ma carte
            </button>
          </div>
        </motion.div>

        {/* Section 2: Ton Profil Ennéagramme */}
        {enneaProfile && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-2xl p-5 md:p-6 mt-6"
        >
          {/* Enneagram Explanation */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-5 md:p-6 border-2 border-gray-200 mb-5">
            <div 
              className="text-center mb-5 cursor-pointer"
              onClick={() => setEnneagramExpanded(!enneagramExpanded)}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="text-3xl">🔮</div>
                <motion.div
                  animate={{ rotate: enneagramExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Ton Profil Ennéagramme</h2>
              <p className="text-gray-600 italic">Découvre ton type de personnalité profond</p>
            </div>

            <AnimatePresence>
              {enneagramExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-col items-center gap-5 pt-2">
                    <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed mb-5">
                      L'ennéagramme est un système qui identifie 9 types de personnalité basés sur tes motivations profondes, tes peurs et tes compulsions inconscientes. Contrairement aux traits de surface, il révèle le "pourquoi" derrière tes comportements.
                    </p>
                    <div className="w-full max-w-3xl space-y-5">
                      <motion.div
                        key="enneagram-title"
                        initial={{ opacity: 0, y: 20 }}
                        animate={enneagramExpanded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ delay: 0.1, duration: 0.4 }}
                      >
                        <h3 className="text-2xl font-bold text-gray-800 mb-2">Type {enneaProfile.type} : {cleanEnneagramName(enneaProfile.name)}</h3>
                        <p className="text-sm text-gray-500 uppercase tracking-wide">Pourquoi ce profil te correspond</p>
                      </motion.div>

                      <motion.div
                        key="enneagram-type"
                        initial={{ opacity: 0, y: 20 }}
                        animate={enneagramExpanded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="bg-white rounded-2xl p-6 border-2 border-gray-200"
                      >
                        <div className="flex gap-5 items-start">
                          <div className="text-4xl">🎯</div>
                          <div>
                            <h4 className="text-lg font-semibold text-gray-800 mb-2">Type {enneaProfile.type} : {cleanEnneagramName(enneaProfile.name)}</h4>
                            <p className="text-gray-600 leading-relaxed">
                              {cleanEnneagramDescription(enneaProfile.desc)}
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Défauts du type */}
                      <motion.div
                        key="enneagram-defauts"
                        initial={{ opacity: 0, y: 20 }}
                        animate={enneagramExpanded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ delay: 0.3, duration: 0.4 }}
                        className="bg-gradient-to-br from-red-50 to-orange-50 rounded-2xl p-3 border-2 border-red-300"
                      >
                        <div className="flex gap-3 items-start">
                          <div className="text-2xl">⚠️</div>
                          <div>
                            <h4 className="text-base font-semibold text-gray-800 mb-1.5">Défauts du type {enneaProfile?.type}</h4>
                            <p className="text-gray-700 leading-relaxed">
                              {enneaProfile?.defauts || "Les défauts typiques de ce type d'ennéagramme incluent des tendances à se perdre dans certains comportements compulsifs. Chaque type a ses propres pièges et défis à surmonter pour atteindre un équilibre personnel."}
                            </p>
                          </div>
                        </div>
                      </motion.div>

                      {/* Construction pendant l'enfance */}
                      <motion.div
                        key="enneagram-enfance"
                        initial={{ opacity: 0, y: 20 }}
                        animate={enneagramExpanded ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                        transition={{ delay: 0.4, duration: 0.4 }}
                        className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-3 border-2 border-blue-300"
                      >
                        <div className="flex gap-3 items-start">
                          <div className="text-2xl">🌱</div>
                          <div>
                            <h4 className="text-base font-semibold text-gray-800 mb-1.5">Comment se construit le type {enneaProfile?.type} pendant l'enfance</h4>
                            <p className="text-gray-700 leading-relaxed">
                              {enneaProfile?.enfance || "Chaque type d'ennéagramme se développe à travers des expériences et dynamiques familiales spécifiques pendant l'enfance. Ces expériences façonnent les stratégies d'adaptation et les mécanismes de défense qui deviennent caractéristiques de chaque type."}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
        )}

        {/* Section 3: Conseils Personnalisés */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-2xl p-5 md:p-6 mt-6"
        >
          {/* Conseils Personnalisés */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-5 md:p-6 border-2 border-gray-200 mb-5">
            <div 
              className="text-center mb-5 cursor-pointer"
              onClick={() => setAdviceExpanded(!adviceExpanded)}
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="text-3xl">🎯</div>
                <motion.div
                  animate={{ rotate: adviceExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </motion.div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Conseils personnalisés</h3>
              <p className="text-gray-600 italic">Comment amplifier tes forces naturelles</p>
            </div>
            <AnimatePresence>
              {adviceExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-5 max-w-4xl mx-auto">
              {(advice.length > 0 ? advice : [
                {
                  number: "1",
                  title: "Cultive ton impatience productive",
                  content:
                    "Ton besoin de résultats rapides n'est pas un défaut, c'est un moteur. Utilise-le : découpe tes gros projets en micro-victoires quotidiennes. Ça te garde motivé et tu avances 10x plus vite.",
                },
                {
                  number: "2",
                  title: "Documente tes raccourcis",
                  content:
                    "Tu trouves constamment des solutions élégantes. Note-les : crée-toi une bibliothèque personnelle de \"patterns qui marchent\". Dans 6 mois, tu auras un arsenal de stratégies éprouvées.",
                },
                {
                  number: "3",
                  title: "Protège tes phases de deep work",
                  content:
                    "Ta force = focus intense sur l'essentiel. Blindage nécessaire : bloque 2-3h par jour en mode \"zéro interruption\". C'est là que tu produis ta meilleure work.",
                },
                {
                  number: "💡",
                  title: "Ton superpower caché",
                  content:
                    "Tu transformes la complexité en simplicité. Quand les autres voient un problème compliqué, tu vois 3 étapes claires. Monétise ça : les gens paieraient cher pour cette clarté. Enseigne, consulte, crée du contenu qui simplifie.",
                  highlight: true,
                },
              ]).map((adviceItem, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex gap-3 p-3 rounded-2xl border-2 transition-all ${
                    adviceItem.highlight
                      ? "bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-300 hover:border-amber-400"
                      : "bg-white border-gray-200 hover:border-purple-400 hover:shadow-lg"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0 ${
                      adviceItem.highlight
                        ? "bg-gradient-to-r from-amber-500 to-orange-600"
                        : "bg-gradient-to-r from-purple-600 to-indigo-600"
                    }`}
                  >
                    {adviceItem.number}
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-800 mb-1.5">{adviceItem.title}</h4>
                    <p className="text-gray-600 leading-relaxed">{adviceItem.content}</p>
                  </div>
                </motion.div>
              ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CTA */}
          <div className="text-center pt-8 border-t-2 border-gray-200">
            <p className="text-gray-600 mb-6">💡 Continue à parler avec ton double pour améliorer sa précision !</p>
            <Link
              href="/messages"
              className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:scale-105 hover:shadow-xl transition-all"
            >
              Parler avec mon Double
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Overlay pour les cartes */}
      <AnimatePresence>
        {overlayCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={() => setOverlayCard(null)}
          >
            {/* Carte au centre (60% de l'écran) */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-[60vw] max-w-2xl max-h-[90vh] overflow-visible"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="max-h-[90vh] overflow-visible">
              {overlayCard === 'traits' && (
                <div className="stats-card relative !p-[18px] md:!p-[28px_18px]">
                  <button
                    onClick={() => setOverlayCard(null)}
                    className="absolute -top-2 -right-2 z-10 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <h2 className="title text-xl font-bold justify-center">
                    🏆 Traits dominants
                  </h2>
                  {traits.map((trait, index) => (
                    <div
                      key={trait.name}
                      className="stat"
                      data-value={trait.score}
                      ref={(el) => {
                        overlayStatRefs.current[index] = el;
                      }}
                    >
                      <span className="label">{trait.name}</span>
                      <div className="bar">
                        <div 
                          className={`fill ${trait.gradient}`}
                          style={{ width: `${trait.score}%` }}
                        ></div>
                      </div>
                      <span className={`score ${trait.colorClass}`}>{trait.score}%</span>
                    </div>
                  ))}
                  <p className="punchline">
                    {summary}
                  </p>
                </div>
              )}

              {overlayCard === 'enneagram' && enneaProfile && (
                <div className="ennea-card-container w-full">
                  <div className="ennea-card relative" style={{ overflow: 'visible' }}>
                    <button
                      onClick={() => setOverlayCard(null)}
                      className="absolute -top-2 -right-2 z-30 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-700 transition-colors hover:bg-gray-100"
                    >
                      <X className="w-5 h-5" />
                    </button>
                    <div className="ennea-card-content">
                      <div className="ennea-header">
                        <div className="ennea-icon">🔮</div>
                        <h1>Ennéagramme</h1>
                      </div>
                      <div className="ennea-type-badge">
                        <div className="ennea-type-title">
                          Type <span className="ennea-type-number">{enneaProfile.type}</span> • <span className="ennea-type-name">{cleanEnneagramName(enneaProfile.name)}</span>
                        </div>
                      </div>
                      <p className="ennea-description">
                        {cleanEnneagramDescription(enneaProfile.desc)}
                      </p>
                      <div className="enneagram-container">
                        <svg viewBox="0 0 400 400">
                          <defs>
                            <linearGradient id="lineGradientOverlay" x1={"0%"} y1={"0%"} x2={"100%"} y2={"100%"}>
                              <stop offset={"0%"} style={{ stopColor: '#667eea', stopOpacity: 1 }} />
                              <stop offset={"100%"} style={{ stopColor: '#764ba2', stopOpacity: 1 }} />
                            </linearGradient>
                            {/* Filtres de glow pour tous les types (overlay) */}
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                              <filter key={`glow${num}Overlay`} id={`glow${num}Overlay`} x={"-50%"} y={"-50%"} width={"200%"} height={"200%"}>
                                <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                                <feMerge>
                                  <feMergeNode in="coloredBlur"/>
                                  <feMergeNode in="SourceGraphic"/>
                                </feMerge>
                              </filter>
                            ))}
                            {/* Gradients de glow pour tous les types (overlay) */}
                            <radialGradient id="glowGradient1Overlay">
                              <stop offset={"0%"} style={{ stopColor: '#f56565', stopOpacity: 0.8 }} />
                              <stop offset={"50%"} style={{ stopColor: '#f56565', stopOpacity: 0.4 }} />
                              <stop offset={"100%"} style={{ stopColor: '#f56565', stopOpacity: 0 }} />
                            </radialGradient>
                            <radialGradient id="glowGradient2Overlay">
                              <stop offset={"0%"} style={{ stopColor: '#ed8936', stopOpacity: 0.8 }} />
                              <stop offset={"50%"} style={{ stopColor: '#ed8936', stopOpacity: 0.4 }} />
                              <stop offset={"100%"} style={{ stopColor: '#ed8936', stopOpacity: 0 }} />
                            </radialGradient>
                            <radialGradient id="glowGradient3Overlay">
                              <stop offset={"0%"} style={{ stopColor: '#ffa834', stopOpacity: 0.8 }} />
                              <stop offset={"50%"} style={{ stopColor: '#ffa834', stopOpacity: 0.4 }} />
                              <stop offset={"100%"} style={{ stopColor: '#ffa834', stopOpacity: 0 }} />
                            </radialGradient>
                            <radialGradient id="glowGradient4Overlay">
                              <stop offset={"0%"} style={{ stopColor: '#f6d365', stopOpacity: 0.8 }} />
                              <stop offset={"50%"} style={{ stopColor: '#f6d365', stopOpacity: 0.4 }} />
                              <stop offset={"100%"} style={{ stopColor: '#f6d365', stopOpacity: 0 }} />
                            </radialGradient>
                            <radialGradient id="glowGradient5Overlay">
                              <stop offset={"0%"} style={{ stopColor: '#d946ef', stopOpacity: 0.8 }} />
                              <stop offset={"50%"} style={{ stopColor: '#d946ef', stopOpacity: 0.4 }} />
                              <stop offset={"100%"} style={{ stopColor: '#d946ef', stopOpacity: 0 }} />
                            </radialGradient>
                            <radialGradient id="glowGradient6Overlay">
                              <stop offset={"0%"} style={{ stopColor: '#06b6d4', stopOpacity: 0.8 }} />
                              <stop offset={"50%"} style={{ stopColor: '#06b6d4', stopOpacity: 0.4 }} />
                              <stop offset={"100%"} style={{ stopColor: '#06b6d4', stopOpacity: 0 }} />
                            </radialGradient>
                            <radialGradient id="glowGradient7Overlay">
                              <stop offset={"0%"} style={{ stopColor: '#10b981', stopOpacity: 0.8 }} />
                              <stop offset={"50%"} style={{ stopColor: '#10b981', stopOpacity: 0.4 }} />
                              <stop offset={"100%"} style={{ stopColor: '#10b981', stopOpacity: 0 }} />
                            </radialGradient>
                            <radialGradient id="glowGradient8Overlay">
                              <stop offset={"0%"} style={{ stopColor: '#3b82f6', stopOpacity: 0.8 }} />
                              <stop offset={"50%"} style={{ stopColor: '#3b82f6', stopOpacity: 0.4 }} />
                              <stop offset={"100%"} style={{ stopColor: '#3b82f6', stopOpacity: 0 }} />
                            </radialGradient>
                            <radialGradient id="glowGradient9Overlay">
                              <stop offset={"0%"} style={{ stopColor: '#8b5cf6', stopOpacity: 0.8 }} />
                              <stop offset={"50%"} style={{ stopColor: '#8b5cf6', stopOpacity: 0.4 }} />
                              <stop offset={"100%"} style={{ stopColor: '#8b5cf6', stopOpacity: 0 }} />
                            </radialGradient>
                          </defs>
                          <circle cx="200" cy="200" r="150" fill="none" stroke="#e2e8f0" strokeWidth="2"/>
                          <path d="M 200 50 L 329.9 320.5 L 70.1 320.5 Z" stroke="#667eea" strokeWidth="5" fill="none" opacity="1"/>
                          <path d="M 329.9 79.5 L 329.9 320.5 M 329.9 320.5 L 70.1 320.5 M 70.1 320.5 L 70.1 79.5 M 70.1 79.5 L 200 50 M 200 50 L 329.9 79.5" stroke="#667eea" strokeWidth="5" fill="none" opacity="1"/>
                          {/* Cercles de glow dynamiques pour le type (overlay) */}
                          {enneaProfile.type === 9 && <circle cx="200" cy="50" r="39" fill="#8b5cf6" opacity="0.7"/>}
                          {enneaProfile.type === 1 && <circle cx="329.9" cy="79.5" r="39" fill="#f56565" opacity="0.7"/>}
                          {enneaProfile.type === 2 && <circle cx="350" cy="200" r="39" fill="#ed8936" opacity="0.7"/>}
                          {enneaProfile.type === 3 && <circle cx="329.9" cy="320.5" r="39" fill="#ffa834" opacity="0.7"/>}
                          {enneaProfile.type === 4 && <circle cx="260" cy="360" r="39" fill="#f6d365" opacity="0.7"/>}
                          {enneaProfile.type === 5 && <circle cx="140" cy="360" r="39" fill="#d946ef" opacity="0.7"/>}
                          {enneaProfile.type === 6 && <circle cx="70.1" cy="320.5" r="39" fill="#06b6d4" opacity="0.7"/>}
                          {enneaProfile.type === 7 && <circle cx="50" cy="200" r="39" fill="#10b981" opacity="0.7"/>}
                          {enneaProfile.type === 8 && <circle cx="70.1" cy="79.5" r="39" fill="#3b82f6" opacity="0.7"/>}
                          
                          {/* Contours jaunes pour le type (overlay) */}
                          {enneaProfile.type === 9 && (
                            <circle cx="200" cy="50" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                          )}
                          {enneaProfile.type === 1 && (
                            <circle cx="329.9" cy="79.5" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                          )}
                          {enneaProfile.type === 2 && (
                            <circle cx="350" cy="200" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                          )}
                          {enneaProfile.type === 3 && (
                            <circle cx="329.9" cy="320.5" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                          )}
                          {enneaProfile.type === 4 && (
                            <circle cx="260" cy="360" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                          )}
                          {enneaProfile.type === 5 && (
                            <circle cx="140" cy="360" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                          )}
                          {enneaProfile.type === 6 && (
                            <circle cx="70.1" cy="320.5" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                          )}
                          {enneaProfile.type === 7 && (
                            <circle cx="50" cy="200" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                          )}
                          {enneaProfile.type === 8 && (
                            <circle cx="70.1" cy="79.5" r="35" fill="none" stroke="#facc15" strokeWidth="4"/>
                          )}
                          
                          <g 
                            className={`ennea-circle ${enneaProfile.type === 9 ? 'ennea-highlight highlight' : ''}`} 
                            data-point="9"
                            onClick={(e) => { e.stopPropagation(); setSelectedEnneagramPoint(9); }}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle className="ennea-point-9" cx="200" cy="50" r={enneaProfile.type === 9 ? 30 : 22}/>
                            <text className="ennea-circle-number" x="200" y="50" style={{ fontSize: enneaProfile.type === 9 ? '30px' : '24px' }}>9</text>
                          </g>
                          <g 
                            className={`ennea-circle ${enneaProfile.type === 1 ? 'ennea-highlight highlight' : ''}`} 
                            data-point="1"
                            onClick={(e) => { e.stopPropagation(); setSelectedEnneagramPoint(1); }}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle className="ennea-point-1" cx="329.9" cy="79.5" r={enneaProfile.type === 1 ? 30 : 22}/>
                            <text className="ennea-circle-number" x="329.9" y="79.5" style={{ fontSize: enneaProfile.type === 1 ? '30px' : '24px' }}>1</text>
                          </g>
                          <g 
                            className={`ennea-circle ${enneaProfile.type === 2 ? 'ennea-highlight highlight' : ''}`} 
                            data-point="2"
                            onClick={(e) => { e.stopPropagation(); setSelectedEnneagramPoint(2); }}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle className="ennea-point-2" cx="350" cy="200" r={enneaProfile.type === 2 ? 30 : 22}/>
                            <text className="ennea-circle-number" x="350" y="200" style={{ fontSize: enneaProfile.type === 2 ? '30px' : '24px' }}>2</text>
                          </g>
                          <g 
                            className={`ennea-circle ${enneaProfile.type === 3 ? 'ennea-highlight highlight' : ''}`} 
                            data-point="3"
                            onClick={(e) => { e.stopPropagation(); setSelectedEnneagramPoint(3); }}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle className="ennea-point-3" cx="329.9" cy="320.5" r={enneaProfile.type === 3 ? 30 : 22}/>
                            <text className="ennea-circle-number" x="329.9" y="320.5" style={{ fontSize: enneaProfile.type === 3 ? '30px' : '24px' }}>3</text>
                          </g>
                          <g 
                            className={`ennea-circle ${enneaProfile.type === 4 ? 'ennea-highlight highlight' : ''}`} 
                            data-point="4"
                            onClick={(e) => { e.stopPropagation(); setSelectedEnneagramPoint(4); }}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle className="ennea-point-4" cx="260" cy="360" r={enneaProfile.type === 4 ? 30 : 22}/>
                            <text className="ennea-circle-number" x="260" y="360" style={{ fontSize: enneaProfile.type === 4 ? '30px' : '24px' }}>4</text>
                          </g>
                          <g 
                            className={`ennea-circle ${enneaProfile.type === 5 ? 'ennea-highlight highlight' : ''}`} 
                            data-point="5"
                            onClick={(e) => { e.stopPropagation(); setSelectedEnneagramPoint(5); }}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle className="ennea-point-5" cx="140" cy="360" r={enneaProfile.type === 5 ? 30 : 22}/>
                            <text className="ennea-circle-number" x="140" y="360" style={{ fontSize: enneaProfile.type === 5 ? '30px' : '24px' }}>5</text>
                          </g>
                          <g 
                            className={`ennea-circle ${enneaProfile.type === 6 ? 'ennea-highlight highlight' : ''}`} 
                            data-point="6"
                            onClick={(e) => { e.stopPropagation(); setSelectedEnneagramPoint(6); }}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle className="ennea-point-6" cx="70.1" cy="320.5" r={enneaProfile.type === 6 ? 30 : 22}/>
                            <text className="ennea-circle-number" x="70.1" y="320.5" style={{ fontSize: enneaProfile.type === 6 ? '30px' : '24px' }}>6</text>
                          </g>
                          <g 
                            className={`ennea-circle ${enneaProfile.type === 7 ? 'ennea-highlight highlight' : ''}`} 
                            data-point="7"
                            onClick={(e) => { e.stopPropagation(); setSelectedEnneagramPoint(7); }}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle className="ennea-point-7" cx="50" cy="200" r={enneaProfile.type === 7 ? 30 : 22}/>
                            <text className="ennea-circle-number" x="50" y="200" style={{ fontSize: enneaProfile.type === 7 ? '30px' : '24px' }}>7</text>
                          </g>
                          <g 
                            className={`ennea-circle ${enneaProfile.type === 8 ? 'ennea-highlight highlight' : ''}`} 
                            data-point="8"
                            onClick={(e) => { e.stopPropagation(); setSelectedEnneagramPoint(8); }}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle className="ennea-point-8" cx="70.1" cy="79.5" r={enneaProfile.type === 8 ? 30 : 22}/>
                            <text className="ennea-circle-number" x="70.1" y="79.5" style={{ fontSize: enneaProfile.type === 8 ? '30px' : '24px' }}>8</text>
                          </g>
                        </svg>
                        {/* Bulle d'information pour les points cliqués (overlay uniquement) */}
                        {selectedEnneagramPoint && overlayCard === 'enneagram' && (() => {
                          const pos = getEnneagramPointPosition(selectedEnneagramPoint);
                          const xPercent = (pos.x / 400) * 100;
                          const yPercent = (pos.y / 400) * 100;
                          
                          // Calculer la position de la bulle selon l'ancre
                          let top = 'auto';
                          let bottom = 'auto';
                          let left = 'auto';
                          let right = 'auto';
                          let transform = '';
                          let arrowClass = '';
                          
                          if (pos.anchor === 'bottom') {
                            top = `${yPercent}%`;
                            left = `${xPercent}%`;
                            transform = 'translate(-50%, calc(-100% - 15px))';
                            arrowClass = 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full';
                          } else if (pos.anchor === 'left') {
                            top = `${yPercent}%`;
                            left = `${xPercent}%`;
                            transform = 'translate(calc(-100% - 15px), -50%)';
                            arrowClass = 'left-0 top-1/2 -translate-y-1/2 -translate-x-full';
                          } else if (pos.anchor === 'right') {
                            top = `${yPercent}%`;
                            right = `${(400 - pos.x) / 400 * 100}%`;
                            transform = 'translate(0, -50%)';
                            arrowClass = 'right-0 top-1/2 -translate-y-1/2 translate-x-full';
                          } else if (pos.anchor === 'top') {
                            bottom = `${(400 - pos.y) / 400 * 100}%`;
                            left = `${xPercent}%`;
                            transform = 'translate(-50%, 0)';
                            arrowClass = 'top-0 left-1/2 -translate-x-1/2 -translate-y-full';
                          }
                          
                          return (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.8 }}
                              className="absolute bg-white rounded-xl shadow-2xl p-4 z-[60] max-w-[300px] border-2 border-purple-200"
                              style={{
                                top,
                                bottom,
                                left,
                                right,
                                transform,
                                maxHeight: '220px',
                                overflowY: 'auto',
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* Flèche pointant vers le point */}
                              <div className={`absolute ${arrowClass} w-0 h-0`}>
                                {pos.anchor === 'bottom' && (
                                  <div 
                                    className="border-8 border-transparent" 
                                    style={{ borderTopColor: '#e9d5ff' }}
                                  ></div>
                                )}
                                {pos.anchor === 'left' && (
                                  <div 
                                    className="border-8 border-transparent" 
                                    style={{ borderLeftColor: '#e9d5ff' }}
                                  ></div>
                                )}
                                {pos.anchor === 'right' && (
                                  <div 
                                    className="border-8 border-transparent" 
                                    style={{ borderRightColor: '#e9d5ff' }}
                                  ></div>
                                )}
                                {pos.anchor === 'top' && (
                                  <div 
                                    className="border-8 border-transparent" 
                                    style={{ borderBottomColor: '#e9d5ff' }}
                                  ></div>
                                )}
                              </div>
                              <button
                                onClick={() => setSelectedEnneagramPoint(null)}
                                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 z-10"
                              >
                                <X className="w-4 h-4" />
                              </button>
                              <h3 className="font-bold text-base mb-2 pr-6 text-purple-600">
                                Type {selectedEnneagramPoint}: {getEnneagramTypeInfo(selectedEnneagramPoint).name}
                              </h3>
                              <p className="text-sm text-gray-700 leading-relaxed">
                                {getEnneagramTypeInfo(selectedEnneagramPoint).description}
                              </p>
                            </motion.div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
