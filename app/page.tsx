"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles, MessageSquare, Mic, Zap } from "lucide-react";

export default function HomePage() {
  return (
    <div className="bg-[#f5f5f7] text-[#1d1d1f] min-h-full">
      {/* Hero Section */}
      <section className="pt-12 pb-20 px-6 bg-[#f5f5f7]">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Crée ton{" "}
              <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
                Double IA
              </span>
              <br />
              en 3 étapes
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
              Un assistant IA qui parle comme toi, pense comme toi, et peut gérer tes messages 24/7
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/onboarding-ia"
                className="px-8 py-4 rounded-lg text-lg font-semibold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] hover:scale-105 transition-transform"
              >
                Créer mon double gratuitement →
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Comment ça marche ?
            </h2>
            <p className="text-xl text-gray-600">
              3 étapes simples pour créer ton assistant IA personnalisé
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Étape 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="bg-gradient-to-b from-gray-50 to-[#f5f5f7] border border-gray-200 rounded-2xl p-8 hover:border-[#e31fc1] transition-all shadow-sm hover:shadow-md">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center mb-6">
                  <MessageSquare className="w-8 h-8 text-black" />
                </div>
                <div className="text-6xl font-bold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent mb-4">01</div>
                <h3 className="text-2xl font-bold mb-3">Ton Style</h3>
                <p className="text-gray-600">
                  Partage des captures d'écran de tes conversations. L'IA analyse ton style d'écriture.
                </p>
              </div>
            </motion.div>

            {/* Étape 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="bg-gradient-to-b from-gray-50 to-[#f5f5f7] border border-gray-200 rounded-2xl p-8 hover:border-[#e31fc1] transition-all shadow-sm hover:shadow-md">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center mb-6">
                  <Sparkles className="w-8 h-8 text-black" />
                </div>
                <div className="text-6xl font-bold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent mb-4">02</div>
                <h3 className="text-2xl font-bold mb-3">Ta Personnalité</h3>
                <p className="text-gray-600">
                  Réponds à un questionnaire rapide pour définir ton caractère et tes centres d'intérêt.
                </p>
              </div>
            </motion.div>

            {/* Étape 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="bg-gradient-to-b from-gray-50 to-[#f5f5f7] border border-gray-200 rounded-2xl p-8 hover:border-[#e31fc1] transition-all shadow-sm hover:shadow-md">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center mb-6">
                  <Mic className="w-8 h-8 text-black" />
                </div>
                <div className="text-6xl font-bold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent mb-4">03</div>
                <h3 className="text-2xl font-bold mb-3">Ta Voix</h3>
                <p className="text-gray-600">
                  Enregistre quelques échantillons vocaux pour cloner ta voix avec ElevenLabs.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-6 bg-[#f5f5f7]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Pourquoi créer ton{" "}
              <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
                Double IA ?
              </span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              { icon: "✨", title: "100% personnalisé", desc: "L'IA apprend ton style, tes expressions, ton humour unique", link: "/onboarding-ia" },
              { icon: "💬", title: "Disponible 24/7", desc: "Ton audience peut te parler à tout moment, même quand tu dors", link: "/onboarding-ia" },
              { icon: "🚀", title: "Sois innovant", desc: "Rejoins les premiers à avoir un double IA", link: "/onboarding-ia" },
            ].map((benefit, index) => (
              <Link
                key={index}
                href={benefit.link}
              >
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-white border border-gray-200 rounded-2xl p-6 hover:scale-105 hover:border-[#e31fc1] transition-all cursor-pointer h-full"
                >
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6">
                    <div className="text-4xl">{benefit.icon}</div>
                  </div>
                  <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.desc}</p>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="pt-12 pb-8 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Prêt à créer ton{" "}
              <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
                Double IA ?
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-10">
              Rejoins des milliers de créateurs qui utilisent déjà leur double IA
            </p>
            <Link
              href="/onboarding-ia"
              className="inline-block px-10 py-5 rounded-lg text-xl font-bold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] hover:scale-105 transition-transform"
            >
              Commencer gratuitement →
            </Link>
            <p className="text-gray-500 text-sm mt-6">
              Aucune carte bancaire requise • Gratuit pour toujours
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
