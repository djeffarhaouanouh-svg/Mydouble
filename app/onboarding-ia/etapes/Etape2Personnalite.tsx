"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";

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
    id: "accept_errors",
    question: "J'ai du mal à accepter mes erreurs.",
    options: [
      { value: "pas_d_accord", label: "Pas d'accord" },
      { value: "neutre", label: "Neutre" },
      { value: "d_accord", label: "D'accord" },
    ],
  },
  {
    id: "do_things_right",
    question: "Je ressens souvent le besoin de faire les choses \"comme il faut\".",
    options: [
      { value: "pas_d_accord", label: "Pas d'accord" },
      { value: "neutre", label: "Neutre" },
      { value: "d_accord", label: "D'accord" },
    ],
  },
  {
    id: "valued_helping",
    question: "Je me sens valorisé quand je peux aider les autres.",
    options: [
      { value: "pas_d_accord", label: "Pas d'accord" },
      { value: "neutre", label: "Neutre" },
      { value: "d_accord", label: "D'accord" },
    ],
  },
  {
    id: "others_before_me",
    question: "J'ai tendance à penser aux besoins des autres avant les miens.",
    options: [
      { value: "pas_d_accord", label: "Pas d'accord" },
      { value: "neutre", label: "Neutre" },
      { value: "d_accord", label: "D'accord" },
    ],
  },
  {
    id: "success_important",
    question: "Réussir est très important pour moi.",
    options: [
      { value: "pas_d_accord", label: "Pas d'accord" },
      { value: "neutre", label: "Neutre" },
      { value: "d_accord", label: "D'accord" },
    ],
  },
  {
    id: "adapt_behavior",
    question: "J'adapte souvent mon comportement pour être bien perçu.",
    options: [
      { value: "pas_d_accord", label: "Pas d'accord" },
      { value: "neutre", label: "Neutre" },
      { value: "d_accord", label: "D'accord" },
    ],
  },
  {
    id: "feel_different",
    question: "Je me sens souvent différent des autres.",
    options: [
      { value: "pas_d_accord", label: "Pas d'accord" },
      { value: "neutre", label: "Neutre" },
      { value: "d_accord", label: "D'accord" },
    ],
  },
  {
    id: "emotions_important",
    question: "Mes émotions prennent une grande place dans ma vie.",
    options: [
      { value: "pas_d_accord", label: "Pas d'accord" },
      { value: "neutre", label: "Neutre" },
      { value: "d_accord", label: "D'accord" },
    ],
  },
  {
    id: "need_alone_time",
    question: "J'ai besoin de beaucoup de temps seul pour me ressourcer.",
    options: [
      { value: "pas_d_accord", label: "Pas d'accord" },
      { value: "neutre", label: "Neutre" },
      { value: "d_accord", label: "D'accord" },
    ],
  },
  {
    id: "understand_depth",
    question: "J'aime comprendre les choses en profondeur avant d'agir.",
    options: [
      { value: "pas_d_accord", label: "Pas d'accord" },
      { value: "neutre", label: "Neutre" },
      { value: "d_accord", label: "D'accord" },
    ],
  },
  {
    id: "think_risks",
    question: "Je pense souvent aux risques possibles avant de prendre une décision.",
    options: [
      { value: "pas_d_accord", label: "Pas d'accord" },
      { value: "neutre", label: "Neutre" },
      { value: "d_accord", label: "D'accord" },
    ],
  },
  {
    id: "need_security",
    question: "J'ai besoin de me sentir en sécurité pour avancer sereinement.",
    options: [
      { value: "pas_d_accord", label: "Pas d'accord" },
      { value: "neutre", label: "Neutre" },
      { value: "d_accord", label: "D'accord" },
    ],
  },
  {
    id: "seek_experiences",
    question: "Je cherche souvent de nouvelles expériences stimulantes.",
    options: [
      { value: "pas_d_accord", label: "Pas d'accord" },
      { value: "neutre", label: "Neutre" },
      { value: "d_accord", label: "D'accord" },
    ],
  },
  {
    id: "avoid_negative",
    question: "J'évite autant que possible les situations trop négatives ou pesantes.",
    options: [
      { value: "pas_d_accord", label: "Pas d'accord" },
      { value: "neutre", label: "Neutre" },
      { value: "d_accord", label: "D'accord" },
    ],
  },
  {
    id: "keep_control",
    question: "J'aime garder le contrôle de ma vie et de mes choix.",
    options: [
      { value: "pas_d_accord", label: "Pas d'accord" },
      { value: "neutre", label: "Neutre" },
      { value: "d_accord", label: "D'accord" },
    ],
  },
  {
    id: "hide_vulnerability",
    question: "Je n'aime pas montrer ma vulnérabilité.",
    options: [
      { value: "pas_d_accord", label: "Pas d'accord" },
      { value: "neutre", label: "Neutre" },
      { value: "d_accord", label: "D'accord" },
    ],
  },
  {
    id: "avoid_conflicts",
    question: "J'évite les conflits autant que possible.",
    options: [
      { value: "pas_d_accord", label: "Pas d'accord" },
      { value: "neutre", label: "Neutre" },
      { value: "d_accord", label: "D'accord" },
    ],
  },
  {
    id: "preserve_harmony",
    question: "Je préfère préserver l'harmonie plutôt que d'imposer mon avis.",
    options: [
      { value: "pas_d_accord", label: "Pas d'accord" },
      { value: "neutre", label: "Neutre" },
      { value: "d_accord", label: "D'accord" },
    ],
  },
];

export default function Etape2Personnalite({ data, onUpdate, onNext, onBack, isLoading, setIsLoading }: Etape2Props) {
  const [answers, setAnswers] = useState<Record<string, any>>(data.personality?.answers || {});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [birthMonth, setBirthMonth] = useState<string>(data.birthMonth || '');
  const [birthDay, setBirthDay] = useState<string>(data.birthDay || '');

  const handleAnswer = (questionId: string, value: any, isMultiple = false) => {
    if (isMultiple) {
      const current = answers[questionId] || [];
      const updated = current.includes(value)
        ? current.filter((v: string) => v !== value)
        : [...current, value];
      setAnswers({ ...answers, [questionId]: updated });
    } else {
      setAnswers({ ...answers, [questionId]: value });
      // Passer automatiquement à la question suivante après avoir répondu
      setTimeout(() => {
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else if (currentQuestionIndex === questions.length - 1) {
          // Si c'est la dernière question, passer à la question de date de naissance
          setCurrentQuestionIndex(questions.length);
        }
      }, 300); // Petit délai pour l'animation
    }
    setError(null);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else if (isBirthDateQuestion) {
      // Si on est sur la question de date de naissance, retourner à la dernière question
      setCurrentQuestionIndex(questions.length - 1);
    }
  };

  const handleSubmit = async () => {
    // Vérifier que toutes les questions obligatoires ont une réponse
    const requiredQuestions = questions.filter((q) => !q.type || q.type !== "checklist");
    const missingAnswers = requiredQuestions.filter((q) => !answers[q.id] || (Array.isArray(answers[q.id]) && answers[q.id].length === 0));

    if (missingAnswers.length > 0) {
      setError(`Il manque ${missingAnswers.length} réponse(s)`);
      return;
    }

    // Vérifier la date de naissance
    if (!birthMonth || !birthDay) {
      setError("Veuillez renseigner votre date de naissance");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userId = localStorage.getItem("userId");
      // Transformer les réponses en règles de personnalité
      const response = await fetch("/api/double-ia/personality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, birthMonth, birthDay, userId }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde");
      }

      const result = await response.json();
      onUpdate({ 
        personality: result.personalityRules,
        birthMonth,
        birthDay
      });
      onNext();
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculer la progression : toutes les questions + date de naissance
  const totalQuestions = questions.length + 1; // 18 questions + date de naissance
  const answeredQuestions = Object.keys(answers).length;
  const hasBirthDate = birthMonth && birthDay ? 1 : 0;
  const progress = ((answeredQuestions + hasBirthDate) / totalQuestions) * 100;
  const currentQuestion = questions[currentQuestionIndex];
  const isMultiple = currentQuestion?.type === "multiple" || currentQuestion?.type === "checklist";
  const currentAnswer = answers[currentQuestion?.id];
  const isBirthDateQuestion = currentQuestionIndex === questions.length;

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
        <div className="mb-6">
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

        {/* Question Slide */}
        <div className="flex flex-col">
          <AnimatePresence mode="wait">
            {isBirthDateQuestion ? (
              <motion.div
                key="birthdate"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-[#e31fc1]">{questions.length + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-4">Quel est ton mois de naissance ?</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Mois</label>
                        <select
                          value={birthMonth}
                          onChange={(e) => setBirthMonth(e.target.value)}
                          className="w-full p-4 rounded-lg border-2 border-gray-300 focus:border-[#e31fc1] focus:outline-none bg-white"
                        >
                          <option value="">Sélectionner</option>
                          <option value="1">Janvier</option>
                          <option value="2">Février</option>
                          <option value="3">Mars</option>
                          <option value="4">Avril</option>
                          <option value="5">Mai</option>
                          <option value="6">Juin</option>
                          <option value="7">Juillet</option>
                          <option value="8">Août</option>
                          <option value="9">Septembre</option>
                          <option value="10">Octobre</option>
                          <option value="11">Novembre</option>
                          <option value="12">Décembre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Jour</label>
                        <select
                          value={birthDay}
                          onChange={(e) => setBirthDay(e.target.value)}
                          className="w-full p-4 rounded-lg border-2 border-gray-300 focus:border-[#e31fc1] focus:outline-none bg-white"
                        >
                          <option value="">Sélectionner</option>
                          {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                            <option key={day} value={day.toString()}>
                              {day}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={currentQuestionIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-lg font-bold text-[#e31fc1]">{currentQuestionIndex + 1}</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold mb-6">{currentQuestion.question}</h3>
                    <div className="space-y-3">
                      {currentQuestion.options.map((option) => {
                        const isSelected = isMultiple
                          ? currentAnswer?.includes(option.value)
                          : currentAnswer === option.value;

                        return (
                          <button
                            key={option.value}
                            onClick={() => handleAnswer(currentQuestion.id, option.value, isMultiple)}
                            className={`w-full text-left p-5 rounded-lg border-2 transition-all ${
                              isSelected
                                ? "border-[#e31fc1] bg-[#e31fc1]/10 shadow-md"
                                : "border-gray-300 hover:border-gray-400 bg-gray-100/50 hover:bg-gray-100"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold text-lg text-black">{option.label}</p>
                                {option.description && (
                                  <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                                )}
                              </div>
                              {isSelected && (
                                <CheckCircle2 className="w-6 h-6 text-[#e31fc1] flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
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

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            onClick={currentQuestionIndex === 0 ? onBack : handlePrevious}
            className="px-6 py-3 rounded-lg border border-gray-300 text-black font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" />
            {currentQuestionIndex === 0 ? "Retour" : "Précédent"}
          </button>

          <div className="flex gap-2">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestionIndex(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentQuestionIndex
                    ? "bg-[#e31fc1] w-8"
                    : answers[questions[idx].id]
                    ? "bg-[#e31fc1]/50"
                    : "bg-gray-300"
                }`}
                aria-label={`Question ${idx + 1}`}
              />
            ))}
            <button
              onClick={() => setCurrentQuestionIndex(questions.length)}
              className={`w-2 h-2 rounded-full transition-all ${
                isBirthDateQuestion
                  ? "bg-[#e31fc1] w-8"
                  : birthMonth && birthDay
                  ? "bg-[#e31fc1]/50"
                  : "bg-gray-300"
              }`}
              aria-label="Date de naissance"
            />
          </div>

          {isBirthDateQuestion && (
            <button
              onClick={handleSubmit}
              disabled={isLoading || !birthMonth || !birthDay}
              className="px-6 py-3 rounded-lg bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-black font-semibold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
            >
              {isLoading ? "Sauvegarde..." : "Continuer"}
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
