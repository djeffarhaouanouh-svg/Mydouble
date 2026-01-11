"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageSquare, Send } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Ici, vous ajouteriez la logique d'envoi du formulaire
    console.log("Form submitted:", formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] py-12">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-8 shadow-sm"
        >
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Contactez-nous</h1>
            <p className="text-gray-600">
              Une question ? Une suggestion ? N'hésitez pas à nous contacter
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <Mail className="w-6 h-6 text-[#e31fc1] flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-black mb-1">Email</h3>
                <p className="text-gray-600 text-sm">contact@mydouble.com</p>
              </div>
            </div>

            <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
              <MessageSquare className="w-6 h-6 text-[#e31fc1] flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-black mb-1">Support</h3>
                <p className="text-gray-600 text-sm">Réponse sous 24h</p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-black mb-2">
                  Nom
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e31fc1] focus:border-transparent outline-none"
                  placeholder="Votre nom"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-black mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e31fc1] focus:border-transparent outline-none"
                  placeholder="votre@email.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-semibold text-black mb-2">
                Sujet
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e31fc1] focus:border-transparent outline-none"
                placeholder="Objet de votre message"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-semibold text-black mb-2">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                required
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#e31fc1] focus:border-transparent outline-none resize-none"
                placeholder="Votre message..."
              />
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-black font-semibold rounded-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              Envoyer le message
            </button>

            {submitted && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-center"
              >
                Message envoyé avec succès ! Nous vous répondrons sous 24h.
              </motion.div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}
