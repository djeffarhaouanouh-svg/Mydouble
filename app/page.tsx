"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Video, Mic, MessageSquare } from "lucide-react";

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
              Ton{" "}
              <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
                Avatar IA
              </span>
              <br />
              en visio
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto">
              Discute en visio avec ton avatar IA personnalise. Une experience immersive et interactive.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/avatar-visio"
                className="px-8 py-4 rounded-lg text-lg font-semibold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] hover:scale-105 transition-transform"
              >
                Lancer Avatar Visio →
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
              Comment ca marche ?
            </h2>
            <p className="text-xl text-gray-600">
              Une experience de conversation video avec ton avatar IA
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="bg-gradient-to-b from-gray-50 to-[#f5f5f7] border border-gray-200 rounded-2xl p-8 hover:border-[#e31fc1] transition-all shadow-sm hover:shadow-md">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center mb-6">
                  <Video className="w-8 h-8 text-black" />
                </div>
                <div className="text-6xl font-bold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent mb-4">01</div>
                <h3 className="text-2xl font-bold mb-3">Avatar Video</h3>
                <p className="text-gray-600">
                  Un avatar realiste qui te ressemble et repond en video.
                </p>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="bg-gradient-to-b from-gray-50 to-[#f5f5f7] border border-gray-200 rounded-2xl p-8 hover:border-[#e31fc1] transition-all shadow-sm hover:shadow-md">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center mb-6">
                  <Mic className="w-8 h-8 text-black" />
                </div>
                <div className="text-6xl font-bold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent mb-4">02</div>
                <h3 className="text-2xl font-bold mb-3">Conversation Vocale</h3>
                <p className="text-gray-600">
                  Parle directement a ton avatar avec le bouton Push-to-Talk.
                </p>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="bg-gradient-to-b from-gray-50 to-[#f5f5f7] border border-gray-200 rounded-2xl p-8 hover:border-[#e31fc1] transition-all shadow-sm hover:shadow-md">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center mb-6">
                  <MessageSquare className="w-8 h-8 text-black" />
                </div>
                <div className="text-6xl font-bold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent mb-4">03</div>
                <h3 className="text-2xl font-bold mb-3">Reponses IA</h3>
                <p className="text-gray-600">
                  Ton avatar repond intelligemment grace a l'IA avancee.
                </p>
              </div>
            </motion.div>
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
              Pret a essayer{" "}
              <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
                Avatar Visio ?
              </span>
            </h2>
            <p className="text-xl text-gray-600 mb-10">
              Lance une conversation video avec ton avatar IA des maintenant
            </p>
            <Link
              href="/avatar-visio"
              className="inline-block px-10 py-5 rounded-lg text-xl font-bold bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] hover:scale-105 transition-transform"
            >
              Lancer Avatar Visio →
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
