"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

interface Trait {
  name: string;
  score: number;
  evolution: number;
  gradient: string;
  colorClass: string;
}

export default function CartePage() {
  const [messagesCount] = useState(234);

  const enneaProfile = {
    type: 3,
    wing: 8,
    label: "3w8",
    name: "Le Battant-Protecteur",
    desc: "Motivé par la réussite et l'impact, tu combines ambition (3) et force (8). Tu avances vite, tu veux des résultats concrets et tu assumes naturellement un rôle de leader protecteur."
  };

  const traits: Trait[] = [
    { name: "Pragmatique", score: 95, evolution: 3, gradient: "grad-purple", colorClass: "purple" },
    { name: "Technique", score: 90, evolution: 5, gradient: "grad-blue", colorClass: "blue" },
    { name: "Direct", score: 88, evolution: 0, gradient: "grad-pink", colorClass: "pink" },
    { name: "Débrouillard", score: 87, evolution: 2, gradient: "grad-green", colorClass: "green" },
    { name: "Curieux", score: 85, evolution: -1, gradient: "grad-yellow", colorClass: "yellow" },
    { name: "Perfectionniste", score: 82, evolution: 4, gradient: "grad-orange", colorClass: "orange" },
  ];

  const statRefs = useRef<(HTMLDivElement | null)[]>([]);

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
              bar.style.width = value + "%";
            }

            if (score) {
              score.classList.add("score-animate");
            }

            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    // Utiliser setTimeout pour s'assurer que les refs sont attachées
    const timeoutId = setTimeout(() => {
      statRefs.current.forEach((ref) => {
        if (ref) {
          observer.observe(ref);
        }
      });
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      statRefs.current.forEach((ref) => {
        if (ref) {
          observer.unobserve(ref);
        }
      });
    };
  }, []);


  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 text-gray-900 pt-12 pb-24">
      <div className="max-w-6xl mx-auto px-6">
        {/* Card Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-2xl p-5 md:p-6"
        >
          {/* Header */}
          <div className="text-center mb-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent"
            >
              🧠 Ta Carte de Personnalité Unique
            </motion.h1>
            <p className="text-gray-600 text-sm mb-2">Tes traits dominants révélés par l'IA</p>
            <div className="inline-flex items-center gap-2 bg-gray-100 px-4 py-2 rounded-full">
              <span className="text-gray-600">📊 Basé sur</span>
              <strong className="text-purple-600">{messagesCount} conversations</strong>
            </div>
          </div>

          {/* Stats Card */}
          <div className="mb-6">
            <div className="stats-card">
              <h2 className="title">
                🏆 Tes traits dominants
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
                  <span className="label">{trait.name}</span>
                  <div className="bar">
                    <div className={`fill ${trait.gradient}`}></div>
                  </div>
                  <span className={`score ${trait.colorClass}`}>{trait.score}%</span>
                </div>
              ))}

              <p className="punchline">
                Un profil orienté résultats, efficacité et solutions concrètes.
              </p>

              <p className="hint">
                📸 Capture cette carte pour partager ton profil.
              </p>
            </div>
          </div>

          {/* Enneagram Section */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-5 md:p-6 border-2 border-gray-200 mb-5">
            <div className="text-center mb-5">
              <h2 className="text-xl font-bold text-gray-800 mb-2">🔮 Ton Profil Ennéagramme</h2>
              <p className="text-gray-600 max-w-3xl mx-auto leading-relaxed">
                L'ennéagramme est un système qui identifie 9 types de personnalité basés sur tes motivations profondes, tes peurs et tes compulsions inconscientes. Contrairement aux traits de surface, il révèle le "pourquoi" derrière tes comportements. Chaque type peut avoir une "aile" : l'influence d'un type voisin qui colore ta personnalité de base.
              </p>
            </div>

            <div className="flex flex-col items-center gap-5">
              <div className="ennea-card-container">
                <div className="ennea-card">
                  <div className="ennea-card-content">
                    <div className="ennea-header">
                      <div className="ennea-icon">🔮</div>
                      <h1>Ton Profil Ennéagramme</h1>
                    </div>

                    <div className="ennea-type-badge">
                      <div className="ennea-type-title">
                        Type <span className="ennea-type-number">{enneaProfile.label}</span> • <span className="ennea-type-name">{enneaProfile.name}</span>
                      </div>
                    </div>

                    <p className="ennea-description">
                      {enneaProfile.desc}
                    </p>

                    <div className="enneagram-container">
                      <svg viewBox="0 0 400 400">
                        <defs>
                          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" style={{ stopColor: '#667eea', stopOpacity: 1 }} />
                            <stop offset="100%" style={{ stopColor: '#764ba2', stopOpacity: 1 }} />
                          </linearGradient>
                          
                          <filter id="glow3" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                          
                          <filter id="glow8" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                            <feMerge>
                              <feMergeNode in="coloredBlur"/>
                              <feMergeNode in="SourceGraphic"/>
                            </feMerge>
                          </filter>
                          
                          <radialGradient id="glowGradient3">
                            <stop offset="0%" style={{ stopColor: '#ffa834', stopOpacity: 0.8 }} />
                            <stop offset="50%" style={{ stopColor: '#ffa834', stopOpacity: 0.4 }} />
                            <stop offset="100%" style={{ stopColor: '#ffa834', stopOpacity: 0 }} />
                          </radialGradient>
                          
                          <radialGradient id="glowGradient8">
                            <stop offset="0%" style={{ stopColor: '#3b82f6', stopOpacity: 0.8 }} />
                            <stop offset="50%" style={{ stopColor: '#3b82f6', stopOpacity: 0.4 }} />
                            <stop offset="100%" style={{ stopColor: '#3b82f6', stopOpacity: 0 }} />
                          </radialGradient>
                        </defs>

                        <circle cx="200" cy="200" r="150" fill="none" stroke="#e2e8f0" strokeWidth="2"/>

                        <path className="ennea-line" d="M 200 50 L 329.9 320.5 L 70.1 320.5 Z"/>
                        <path className="ennea-line" d="M 329.9 79.5 L 329.9 320.5 M 329.9 320.5 L 70.1 320.5 M 70.1 320.5 L 70.1 79.5 M 70.1 79.5 L 200 50 M 200 50 L 329.9 79.5"/>
                        
                        <circle className="glow-circle-3" cx="329.9" cy="320.5" r="35" fill="url(#glowGradient3)" opacity="0.7"/>
                        
                        <circle className="glow-circle-8" cx="70.1" cy="79.5" r="32" fill="url(#glowGradient8)" opacity="0.7"/>
                        
                        <g className="ennea-circle" data-point="9">
                          <circle className="ennea-point-9" cx="200" cy="50" r="22"/>
                          <text className="ennea-circle-number" x="200" y="50">9</text>
                        </g>
                        
                        <g className="ennea-circle" data-point="1">
                          <circle className="ennea-point-1" cx="329.9" cy="79.5" r="22"/>
                          <text className="ennea-circle-number" x="329.9" y="79.5">1</text>
                        </g>
                        
                        <g className="ennea-circle" data-point="2">
                          <circle className="ennea-point-2" cx="350" cy="200" r="22"/>
                          <text className="ennea-circle-number" x="350" y="200">2</text>
                        </g>
                        
                        <g className={`ennea-circle ennea-highlight ${3 === enneaProfile.type ? 'highlight' : ''}`} data-point="3">
                          <circle className="ennea-point-3" cx="329.9" cy="320.5" r="26" filter="url(#glow3)"/>
                          <text className="ennea-circle-number" x="329.9" y="320.5" style={{ fontSize: '26px' }}>3</text>
                        </g>
                        
                        <g className="ennea-circle" data-point="4">
                          <circle className="ennea-point-4" cx="260" cy="360" r="22"/>
                          <text className="ennea-circle-number" x="260" y="360">4</text>
                        </g>
                        
                        <g className="ennea-circle" data-point="5">
                          <circle className="ennea-point-5" cx="140" cy="360" r="22"/>
                          <text className="ennea-circle-number" x="140" y="360">5</text>
                        </g>
                        
                        <g className="ennea-circle" data-point="6">
                          <circle className="ennea-point-6" cx="70.1" cy="320.5" r="22"/>
                          <text className="ennea-circle-number" x="70.1" y="320.5">6</text>
                        </g>
                        
                        <g className="ennea-circle" data-point="7">
                          <circle className="ennea-point-7" cx="50" cy="200" r="22"/>
                          <text className="ennea-circle-number" x="50" y="200">7</text>
                        </g>
                        
                        <g className={`ennea-circle ennea-highlight ${8 === enneaProfile.wing ? 'highlight' : ''}`} data-point="8">
                          <circle className="ennea-point-8" cx="70.1" cy="79.5" r="24" filter="url(#glow8)"/>
                          <text className="ennea-circle-number" x="70.1" y="79.5" style={{ fontSize: '25px' }}>8</text>
                        </g>
                      </svg>
                    </div>

                    <div className="ennea-footer">
                      <span className="ennea-footer-icon">📸</span>
                      <span>Capture cette carte pour partager ton profil.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Enneagram Explanation */}
              <div className="w-full max-w-3xl space-y-5">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Type 3w8 : Le Battant-Protecteur</h3>
                  <p className="text-sm text-gray-500 uppercase tracking-wide">Pourquoi ce profil te correspond</p>
                </div>

                <div className="bg-white rounded-2xl p-6 border-2 border-gray-200">
                  <div className="flex gap-5 items-start">
                    <div className="text-4xl">🎯</div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-800 mb-2">Type 3 : Le Battant</h4>
                      <p className="text-gray-600 leading-relaxed">
                        Tu es orienté vers la <strong className="text-purple-600">réussite concrète</strong> et l'efficacité. Tu veux des résultats visibles et tu détestes perdre du temps. Ton moteur ? Être reconnu pour tes accomplissements et atteindre tes objectifs rapidement. Tu t'adaptes vite et tu trouves toujours des solutions pragmatiques.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-3 border-2 border-gray-200">
                  <div className="flex gap-3 items-start">
                    <div className="text-2xl">⚡</div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-800 mb-1.5">Aile 8 : Le Protecteur</h4>
                      <p className="text-gray-600 leading-relaxed">
                        L'influence du type 8 te rend plus <strong className="text-purple-600">direct, assertif et indépendant</strong>. Tu préfères "ça marche" à "c'est parfait". Tu contrôles ta propre destinée et tu n'as pas peur de foncer. Cette aile amplifie ton côté pragmatique et ton besoin de maîtriser ton environnement.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-2xl p-3 border-2 border-amber-300">
                  <div className="flex gap-3 items-start">
                    <div className="text-2xl">💡</div>
                    <div>
                      <h4 className="text-base font-semibold text-gray-800 mb-1.5">Ce que ça signifie pour toi</h4>
                      <ul className="space-y-2 text-gray-700">
                        <li><strong className="text-amber-700">Motivation :</strong> Réussir à ta manière, rapidement</li>
                        <li><strong className="text-amber-700">Force :</strong> Capacité d'action et d'adaptation</li>
                        <li><strong className="text-amber-700">Défi :</strong> Ne pas sacrifier l'authenticité pour l'efficacité</li>
                        <li><strong className="text-amber-700">Style :</strong> Entrepreneur pragmatique et déterminé</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Conseils Personnalisés */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-3xl p-5 md:p-6 border-2 border-gray-200 mb-5">
            <div className="text-center mb-5">
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Conseils personnalisés</h3>
              <p className="text-gray-600 italic">Comment amplifier tes forces naturelles</p>
            </div>
            <div className="space-y-5 max-w-4xl mx-auto">
              {[
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
              ].map((advice, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex gap-3 p-3 rounded-2xl border-2 transition-all ${
                    advice.highlight
                      ? "bg-gradient-to-br from-yellow-50 to-amber-50 border-amber-300 hover:border-amber-400"
                      : "bg-white border-gray-200 hover:border-purple-400 hover:shadow-lg"
                  }`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white flex-shrink-0 ${
                      advice.highlight
                        ? "bg-gradient-to-r from-amber-500 to-orange-600"
                        : "bg-gradient-to-r from-purple-600 to-indigo-600"
                    }`}
                  >
                    {advice.number}
                  </div>
                  <div>
                    <h4 className="text-base font-semibold text-gray-800 mb-1.5">{advice.title}</h4>
                    <p className="text-gray-600 leading-relaxed">{advice.content}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="text-center pt-8 border-t-2 border-gray-200">
            <p className="text-gray-600 mb-6">💡 Continue à parler avec ton double pour améliorer sa précision !</p>
            <Link
              href="/mon-double-ia"
              className="inline-block bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-10 py-4 rounded-xl font-semibold text-lg hover:scale-105 hover:shadow-xl transition-all"
            >
              Parler avec mon Double
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
