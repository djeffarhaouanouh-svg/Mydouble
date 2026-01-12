"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { AlertCircle, CheckCircle2, ChevronRight } from "lucide-react";

interface Etape2Props {
  data: any;
  onUpdate: (updates: any) => void;
  onNext: () => void;
  onBack: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

const questions: Array<{
  id: string;
  question: string;
  type?: string;
  options: QuestionOption[];
}> = [
  {
    id: "tone",
    question: "Quel est ton ton général en conversation ?",
    options: [
      { value: "professional", label: "Professionnel", description: "Formel et sérieux" },
      { value: "friendly", label: "Amical", description: "Chaleureux et bienveillant" },
      { value: "casual", label: "Décontracté", description: "Relax et naturel" },
      { value: "humorous", label: "Humoristique", description: "Drôle et léger" },
    ],
  },
  {
    id: "energy_level",
    question: "Quel est ton niveau d'énergie ?",
    options: [
      { value: "low", label: "Calme", description: "Posé et réfléchi" },
      { value: "medium", label: "Modéré", description: "Équilibré" },
      { value: "high", label: "Énergique", description: "Dynamique et enthousiaste" },
    ],
  },
  {
    id: "response_length",
    question: "Tu préfères des réponses comment ?",
    options: [
      { value: "concise", label: "Très courtes", description: "Direct au but" },
      { value: "short", label: "Courtes", description: "Brèves mais complètes" },
      { value: "medium", label: "Moyennes", description: "Équilibrées" },
      { value: "detailed", label: "Détaillées", description: "Approfondies" },
    ],
  },
  {
    id: "empathy",
    question: "Niveau d'empathie et d'écoute ?",
    options: [
      { value: "low", label: "Bas", description: "Factuel et rationnel" },
      { value: "medium", label: "Moyen", description: "Équilibré" },
      { value: "high", label: "Élevé", description: "Très à l'écoute" },
    ],
  },
  {
    id: "humor_style",
    question: "Ton type d'humour ?",
    options: [
      { value: "none", label: "Aucun", description: "Sérieux" },
      { value: "light", label: "Léger", description: "Subtil" },
      { value: "sarcastic", label: "Sarcastique", description: "Piquant" },
      { value: "witty", label: "Esprit vif", description: "Intelligent et rapide" },
    ],
  },
  {
    id: "topics_comfort",
    question: "Sujets avec lesquels tu es à l'aise ?",
    type: "multiple",
    options: [
      { value: "tech", label: "Tech & Innovation" },
      { value: "music", label: "Musique" },
      { value: "travel", label: "Voyages" },
      { value: "food", label: "Cuisine" },
      { value: "sports", label: "Sport" },
      { value: "art", label: "Art & Culture" },
      { value: "business", label: "Business" },
      { value: "philosophy", label: "Philosophie" },
    ],
  },
  {
    id: "conversation_boundaries",
    question: "Limites de conversation ?",
    type: "checklist",
    options: [
      { value: "flirting", label: "Accepte le flirt" },
      { value: "personal_questions", label: "Accepte les questions personnelles" },
      { value: "advice_giving", label: "Donne des conseils" },
      { value: "debates", label: "Aime débattre" },
    ],
  },
];

export default function Etape2Personnalite({ data, onUpdate, onNext, onBack, isLoading, setIsLoading }: Etape2Props) {
  const [answers, setAnswers] = useState<Record<string, any>>(data.personality?.answers || {});
  const [error, setError] = useState<string | null>(null);

  const handleAnswer = (questionId: string, value: any, isMultiple = false) => {
    if (isMultiple) {
      const current = answers[questionId] || [];
      const updated = current.includes(value)
        ? current.filter((v: string) => v !== value)
        : [...current, value];
      setAnswers({ ...answers, [questionId]: updated });
    } else {
      setAnswers({ ...answers, [questionId]: value });
    }
    setError(null);
  };

  const handleSubmit = async () => {
    // Vérifier que toutes les questions obligatoires ont une réponse
    const requiredQuestions = questions.filter((q) => !q.type || q.type !== "checklist");
    const missingAnswers = requiredQuestions.filter((q) => !answers[q.id] || (Array.isArray(answers[q.id]) && answers[q.id].length === 0));

    if (missingAnswers.length > 0) {
      setError(`Il manque ${missingAnswers.length} réponse(s)`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Transformer les réponses en règles de personnalité
      const response = await fetch("/api/double-ia/personality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      const result = await response.json();
      onUpdate({ personality: result.personalityRules });
      onNext();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const progress = (Object.keys(answers).length / questions.length) * 100;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">
            Définis ta{" "}
            <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
              personnalité
            </span>
          </h2>
          <p className="text-gray-600">
            Réponds à ces questions pour que ton IA adopte ton caractère
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Progression</span>
            <span className="text-black font-semibold">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-8">
          {questions.map((question, idx) => {
            const isMultiple = question.type === "multiple" || question.type === "checklist";
            const currentAnswer = answers[question.id];

            return (
              <motion.div
                key={question.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="space-y-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-bold text-[#e31fc1]">{idx + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-3">{question.question}</h3>
                    <div className="space-y-2">
                      {question.options.map((option) => {
                        const isSelected = isMultiple
                          ? currentAnswer?.includes(option.value)
                          : currentAnswer === option.value;

                        return (
                          <button
                            key={option.value}
                            onClick={() => handleAnswer(question.id, option.value, isMultiple)}
                            className={`w-full text-left p-4 rounded-lg border transition-all ${
                              isSelected
                                ? "border-[#e31fc1] bg-[#e31fc1]/10"
                                : "border-gray-300 hover:border-gray-400 bg-gray-100/50"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-black">{option.label}</p>
                                {option.description && (
                                  <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                                )}
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="w-5 h-5 text-[#e31fc1] flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3">
          <div className="flex gap-4">
            <button
              onClick={onBack}
              className="px-6 py-3 rounded-lg border border-gray-300 text-black font-semibold hover:bg-gray-100 transition-colors"
            >
              ← Retour
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 py-3 rounded-lg bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-black font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? "Sauvegarde..." : "Continuer →"}
            </button>
          </div>

          {/* Skip Button */}
          <button
            onClick={() => {
              // Passer avec des données mock
              onUpdate({
                personality: {
                  tone: "friendly",
                  energy_level: "medium",
                  response_length: "medium",
                  empathy: "medium",
                  humor_style: "light",
                  topics_comfortable: [],
                  conversation_boundaries: {},
                  description: "Personnalité par défaut",
                },
              });
              onNext();
            }}
            disabled={isLoading}
            className="w-full py-3 rounded-lg border-2 border-gray-300 text-gray-600 font-semibold hover:border-gray-400 hover:text-gray-300 transition-colors disabled:opacity-50"
          >
            Passer cette étape →
          </button>
        </div>
      </div>
    </div>
  );
}
