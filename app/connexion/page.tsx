"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

function ConnexionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';
  
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        throw new Error('Erreur de communication avec le serveur. Vérifiez votre connexion.');
      }

      if (!response.ok) {
        const errorMessage = data.error || data.message || 'Une erreur est survenue';
        throw new Error(errorMessage);
      }

      // Sauvegarder les infos utilisateur dans localStorage
      if (data.userId) {
        localStorage.setItem('userId', data.userId.toString());
        if (data.userName) localStorage.setItem('userName', data.userName);
        if (data.userEmail) localStorage.setItem('userEmail', data.userEmail);
      }

      // Rediriger vers la page demandée
      router.push(redirectTo);
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Erreur de connexion. Vérifiez votre connexion internet et que le serveur est démarré.');
      } else {
        const errorMsg = err.message || (isLogin ? 'Une erreur est survenue lors de la connexion' : 'Une erreur est survenue lors de l\'inscription');
        setError(errorMsg);
      }
      console.error(`Erreur ${isLogin ? 'connexion' : 'inscription'}:`, err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B2030] via-[#124B6B] to-[#1E7FB0] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-block mb-4">
              <svg width="180" height="46" viewBox="0 0 1400 360" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="swayBlueConnexion" x1="0" y1="0" x2="1400" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#0B2030"/>
                    <stop offset="18%" stopColor="#124B6B"/>
                    <stop offset="35%" stopColor="#1E7FB0"/>
                    <stop offset="55%" stopColor="#3BB9FF"/>
                    <stop offset="70%" stopColor="#2FA9F2"/>
                    <stop offset="85%" stopColor="#A9E8FF"/>
                    <stop offset="94%" stopColor="#F6FDFF"/>
                    <stop offset="100%" stopColor="#FFFFFF"/>
                  </linearGradient>
                </defs>
                <rect width="100%" height="100%" fill="transparent"/>
                <text x="50%" y="60%" textAnchor="middle"
                  fontFamily="Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial"
                  fontSize="170" fontWeight="800">
                  <tspan fill="transparent" stroke="white" strokeWidth="7" strokeLinejoin="round">swayco</tspan>
                  <tspan fill="transparent" stroke="url(#swayBlueConnexion)" strokeWidth="7" strokeLinejoin="round">.ai</tspan>
                </text>
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {isLogin ? 'Connexion' : 'Inscription'}
            </h1>
            <p className="text-white/80">
              {isLogin 
                ? 'Connecte-toi pour accéder à ton double IA' 
                : 'Crée ton compte pour créer ton double IA'}
            </p>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Nom de profil
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                  <input
                    type="text"
                    required={!isLogin}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 backdrop-blur-sm"
                    placeholder="Jean Dupont"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 backdrop-blur-sm"
                  placeholder="jean@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40 backdrop-blur-sm"
                  placeholder="••••••••"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm backdrop-blur-sm"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#3BB9FF] via-[#2FA9F2] to-[#A9E8FF] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isLogin ? 'Connexion...' : 'Inscription...'}
                </>
              ) : (
                <>
                  {isLogin ? 'Se connecter' : "S'inscrire"}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setFormData({ name: '', email: '', password: '' });
              }}
              className="text-sm text-white/80 hover:text-white transition-colors underline"
            >
              {isLogin 
                ? "Pas encore de compte ? S'inscrire" 
                : 'Déjà un compte ? Se connecter'}
            </button>
          </div>

          {/* Lien retour */}
          <div className="mt-4 text-center">
            <Link
              href="/"
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-[#0B2030] via-[#124B6B] to-[#1E7FB0] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <ConnexionForm />
    </Suspense>
  );
}
