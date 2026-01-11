"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Upload, User, Mic, Sparkles } from "lucide-react";

// Import des étapes
import Etape1Style from "./etapes/Etape1Style";
import Etape2Personnalite from "./etapes/Etape2Personnalite";
import Etape3Voix from "./etapes/Etape3Voix";
import EtapeFinale from "./etapes/EtapeFinale";

type OnboardingStep = 1 | 2 | 3 | 4;

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

  const steps = [
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
    {
      number: 4,
      title: "Finalisation",
      icon: Sparkles,
      description: "Crée ton double",
    },
  ];

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as OnboardingStep);
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
                  width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Steps */}
            {steps.map((step) => {
              const Icon = step.icon;
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
            {currentStep === 4 && (
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
