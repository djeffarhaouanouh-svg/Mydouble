"use client";

import { motion } from "framer-motion";
import { Trophy, Crown, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";

interface RankingUser {
  id: string;
  name: string;
  avatar?: string;
  messages: number;
  rank: number;
}

export default function ClassementPage() {
  const [rankings, setRankings] = useState<RankingUser[]>([
    { id: "1", name: "lenny", messages: 46, rank: 1, avatar: "👑" },
    { id: "2", name: "Sophie", messages: 38, rank: 2, avatar: "🌟" },
    { id: "3", name: "Marc", messages: 32, rank: 3, avatar: "⚡" },
  ]);
  const [selectedUser, setSelectedUser] = useState("Lauryn");

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] pb-24">
      <div className="max-w-4xl mx-auto px-6 pt-8">
        {/* Header avec avatar circulaire */}
        <div className="flex flex-col items-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="w-24 h-24 rounded-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center mb-4 relative"
          >
            <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div className="absolute -top-2 bg-white px-3 py-1 rounded-full border border-[#e31fc1]">
              <span className="text-sm font-semibold">{selectedUser}</span>
            </div>
          </motion.div>

          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-6 h-6 text-[#e31fc1]" />
            <h1 className="text-3xl font-bold">
              Classement{" "}
              <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
                {selectedUser}
              </span>
            </h1>
          </div>
          <p className="text-gray-600">Les fans les plus actifs de {selectedUser}</p>
        </div>

        {/* Titre section */}
        <h2 className="text-2xl font-bold text-center mb-6">Classement complet</h2>

        {/* Liste des utilisateurs */}
        <div className="space-y-4">
          {rankings.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-[#e31fc1] transition-all shadow-sm hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {/* Badge de rang */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#ffd700] via-[#ffed4e] to-[#ffd700] flex items-center justify-center">
                    {user.rank === 1 ? (
                      <Crown className="w-6 h-6 text-black" />
                    ) : (
                      <span className="text-lg font-bold text-black">#{user.rank}</span>
                    )}
                  </div>

                  {/* Avatar utilisateur */}
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-2xl">{user.avatar}</span>
                  </div>

                  {/* Nom */}
                  <div>
                    <p className="font-semibold text-lg text-black flex items-center gap-2">
                      {user.name}
                      {user.rank === 1 && <span className="text-sm">✨</span>}
                    </p>
                  </div>
                </div>

                {/* Nombre de messages */}
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#e31fc1]" />
                  <div className="text-right">
                    <p className="text-2xl font-bold text-[#e31fc1]">{user.messages}</p>
                    <p className="text-xs text-gray-600">messages</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA retour */}
        <div className="mt-8 text-center">
          <button
            onClick={() => window.history.back()}
            className="px-8 py-4 rounded-lg bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-black font-semibold hover:scale-105 transition-transform"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}
