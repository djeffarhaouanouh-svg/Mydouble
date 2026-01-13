"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Upload, User, Mic, Sparkles } from "lucide-react";

// Import des étapes
import Etape1Style from "./etapes/Etape1Style";
import Etape2Personnalite from "./etapes/Etape2Personnalite";
import Etape3Voix from "./etapes/Etape3Voix";
import Etape3Compte from "./etapes/Etape3Compte";
import EtapeFinale from "./etapes/EtapeFinale";

type OnboardingStep = 1 | 2 | 3 | 4 | 5;

interface OnboardingData {
  // Étape 1
  styleScreenshots: File[];
  styleRules?: any;

  // Étape 2
  personality?: {
    tone: string;
    traits: string[];
    interests: string[];
  };
  birthMonth?: string;
  birthDay?: string;

  // Étape 3
  voiceSamples: File[];
  voiceId?: string;
}

export default function OnboardingIA() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1);
  const [data, setData] = useState<OnboardingData>({
    styleScreenshots: [],
    voiceSamples: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    const isValidUserId = userId && 
                          !userId.startsWith('user_') && 
                          !userId.startsWith('temp_') &&
                          !isNaN(Number(userId));
    setIsLoggedIn(!!isValidUserId);
  }, []);

  // Étapes visibles dans le stepper (seulement 3)
  const visibleSteps = [
    {
      number: 1,
      title: "Style d'écriture",
      icon: Upload,
      description: "Analyse tes conversations",
    },
    {
      number: 2,
      title: "Personnalité",
      icon: User,
      description: "Définis ton caractère",
    },
    {
      number: 3,
      title: "Voix",
      icon: Mic,
      description: "Clone ta voix",
    },
  ];

  // Toutes les étapes (y compris celles cachées)
  const allSteps = [
    ...visibleSteps,
    {
      number: 4,
      title: "Compte",
      icon: User,
      description: "Crée ton compte",
      hidden: true, // Étape cachée mais obligatoire
    },
    {
      number: 5,
      title: "Finalisation",
      icon: Sparkles,
      description: "Crée ton double",
    },
  ];

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep((prev) => {
        const nextStep = (prev + 1) as OnboardingStep;
        // Si l'utilisateur est connecté et qu'on arrive à l'étape 4 (Compte), passer directement à l'étape 5 (Finalisation)
        if (nextStep === 4 && isLoggedIn) {
          return 5 as OnboardingStep;
        }
        return nextStep;
      });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as OnboardingStep);
    }
  };

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] pt-12 pb-24">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold mb-4"
          >
            Crée ton{" "}
            <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
              double IA
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-gray-400"
          >
            Seulement 3 étapes pour créer ton assistant personnel
          </motion.p>
        </div>

        {/* Stepper */}
        <div className="mb-12">
          <div className="flex justify-between items-center relative">
            {/* Ligne de progression */}
            <div className="absolute top-5 left-0 right-0 h-1 bg-gray-200 z-0">
              <motion.div
                className="h-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb]"
                initial={{ width: "0%" }}
                animate={{
                  // Calculer la progression basée sur les étapes visibles (1-3) et l'étape finale (5)
                  // Étape 1: 0%, Étape 2: 33%, Étape 3: 66%, Étape 4 (cachée): 66%, Étape 5: 100%
                  width: currentStep <= 3 
                    ? `${((currentStep - 1) / 2) * 100}%`
                    : currentStep === 4
                    ? "66%"
                    : "100%",
                }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Steps - Afficher seulement les étapes visibles */}
            {visibleSteps.map((step) => {
              const Icon = step.icon;
              // L'étape est complétée si on est à une étape supérieure (en comptant les étapes cachées)
              const isCompleted = currentStep > step.number;
              const isCurrent = currentStep === step.number;

              return (
                <div
                  key={step.number}
                  className="flex flex-col items-center relative z-10"
                >
                  <motion.div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                      isCompleted
                        ? "bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb]"
                        : isCurrent
                        ? "bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] ring-4 ring-[#e31fc1]/20"
                        : "bg-gray-200"
                    }`}
                    animate={{
                      scale: isCurrent ? 1.1 : 1,
                    }}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5 text-black" />
                    ) : (
                      <Icon
                        className={`w-5 h-5 ${
                          isCurrent ? "text-black" : "text-gray-500"
                        }`}
                      />
                    )}
                  </motion.div>
                  <div className="text-center hidden md:block">
                    <p
                      className={`text-sm font-semibold ${
                        isCurrent ? "text-black" : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400">{step.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Contenu de l'étape */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === 1 && (
              <Etape1Style
                data={data}
                onUpdate={updateData}
                onNext={handleNext}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
            {currentStep === 2 && (
              <Etape2Personnalite
                data={data}
                onUpdate={updateData}
                onNext={handleNext}
                onBack={handleBack}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
            {currentStep === 3 && (
              <Etape3Voix
                data={data}
                onUpdate={updateData}
                onNext={handleNext}
                onBack={handleBack}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
            {currentStep === 4 && !isLoggedIn && (
              <Etape3Compte
                data={data}
                onUpdate={updateData}
                onNext={handleNext}
                onBack={handleBack}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
            {currentStep === 4 && isLoggedIn && (
              // Si l'utilisateur est déjà connecté, passer directement à la finalisation
              <EtapeFinale
                data={data}
                onBack={handleBack}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
            {currentStep === 5 && (
              <EtapeFinale
                data={data}
                onBack={handleBack}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
