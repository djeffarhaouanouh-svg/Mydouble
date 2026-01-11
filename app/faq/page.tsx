"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const faqData: FAQItem[] = [
  {
    question: "Qu'est-ce que MyDouble ?",
    answer: "MyDouble est une plateforme qui vous permet de créer un assistant IA personnalisé qui parle comme vous, pense comme vous, et peut gérer vos messages 24/7.",
  },
  {
    question: "Comment fonctionne la création du double IA ?",
    answer: "En 3 étapes simples : 1) Uploadez des captures d'écran de vos conversations pour que l'IA apprenne votre style d'écriture. 2) Définissez votre personnalité en répondant à un questionnaire. 3) Clonez votre voix en enregistrant des échantillons audio.",
  },
  {
    question: "Est-ce gratuit ?",
    answer: "Oui, la création de base de votre double IA est gratuite. Des fonctionnalités premium peuvent être disponibles avec un abonnement mensuel.",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer: "Absolument. Nous prenons la sécurité très au sérieux. Toutes vos données sont cryptées et stockées de manière sécurisée. Nous ne partageons jamais vos informations avec des tiers sans votre consentement.",
  },
  {
    question: "Puis-je modifier mon double IA après l'avoir créé ?",
    answer: "Oui, vous pouvez à tout moment modifier votre double IA : ajuster sa personnalité, son style d'écriture, ou même sa voix.",
  },
  {
    question: "Combien de temps faut-il pour créer un double IA ?",
    answer: "Le processus de création prend environ 5-10 minutes. L'analyse et la configuration se font ensuite automatiquement en quelques minutes.",
  },
  {
    question: "Puis-je supprimer mon double IA ?",
    answer: "Oui, vous pouvez supprimer votre double IA à tout moment depuis les paramètres de votre compte. Toutes vos données seront alors définitivement effacées.",
  },
  {
    question: "Le double IA peut-il vraiment parler comme moi ?",
    answer: "Grâce à l'analyse de vos conversations et au clonage vocal, votre double IA reproduit fidèlement votre style d'écriture et votre voix. Plus vous fournissez de données, plus le résultat sera précis.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleQuestion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] py-12">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">
            Questions{" "}
            <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
              fréquentes
            </span>
          </h1>
          <p className="text-gray-600">
            Vous avez des questions ? Nous avons les réponses !
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqData.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleQuestion(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-black pr-4">{item.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-[#e31fc1] flex-shrink-0 transition-transform ${
                    openIndex === index ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-4 text-gray-600">{item.answer}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center bg-white rounded-xl p-8 shadow-sm"
        >
          <h2 className="text-2xl font-bold mb-4">Vous ne trouvez pas votre réponse ?</h2>
          <p className="text-gray-600 mb-6">
            Notre équipe support est là pour vous aider
          </p>
          <a
            href="/contact"
            className="inline-block px-8 py-4 bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-black font-semibold rounded-lg hover:scale-105 transition-transform"
          >
            Contactez-nous
          </a>
        </motion.div>
      </div>
    </div>
  );
}
