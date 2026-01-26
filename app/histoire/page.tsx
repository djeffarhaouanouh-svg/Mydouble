"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Image, X, Loader2, FileText } from "lucide-react";
import { motion } from "framer-motion";

type UploadState = "idle" | "uploading" | "success" | "error";

export default function HistoirePage() {
  const router = useRouter();
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [scrollY, setScrollY] = useState(0);
  
  // États pour l'upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadFileUrl, setUploadFileUrl] = useState<string | null>(null);
  const [scenario, setScenario] = useState("");
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Gérer la visibilité du header au scroll et le scroll Y pour les animations
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      if (currentScrollY < 10) {
        setIsHeaderVisible(true);
      } else if (currentScrollY > lastScrollY) {
        setIsHeaderVisible(false);
      } else {
        setIsHeaderVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      if (uploadFileUrl) {
        URL.revokeObjectURL(uploadFileUrl);
      }
    };
  }, [uploadFileUrl]);

  // Gérer le changement de fichier upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Le fichier doit être une image (JPG, PNG, etc.)");
      return;
    }

    setError(null);
    setUploadFile(file);
    
    if (uploadFileUrl) {
      URL.revokeObjectURL(uploadFileUrl);
    }
    
    const url = URL.createObjectURL(file);
    setUploadFileUrl(url);
  };

  // Ouvrir le sélecteur de fichier
  const handleUploadClick = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  // Supprimer la photo
  const handleRemovePhoto = () => {
    setUploadFile(null);
    if (uploadFileUrl) {
      URL.revokeObjectURL(uploadFileUrl);
      setUploadFileUrl(null);
    }
  };

  // Upload la photo et le scénario
  const handleSubmit = async () => {
    if (!uploadFile) {
      setError("Veuillez sélectionner une photo");
      return;
    }

    if (!scenario.trim()) {
      setError("Veuillez décrire le scénario");
      return;
    }

    setUploadState("uploading");
    setError(null);

    try {
      const formData = new FormData();
      formData.append('photo', uploadFile, uploadFile.name);
      formData.append('scenario', scenario);
      
      const userId = localStorage.getItem('userId');
      if (userId) {
        formData.append('userId', userId);
      }

      const response = await fetch('/api/histoire/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de l\'upload');
      }

      const data = await response.json();
      setUploadState("success");
      
      // Rediriger après 2 secondes
      setTimeout(() => {
        router.push('/avatar-fx');
      }, 2000);
    } catch (err) {
      console.error('Erreur upload:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'upload');
      setUploadState("error");
    }
  };

  const canSubmit = uploadFile && scenario.trim().length > 0;

  return (
    <div className="bg-[#0F0F0F] text-white">
      {/* Header */}
      <header className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between pl-3 pr-12 md:pl-4 md:pr-20 py-3 border-b border-[#2A2A2A] bg-[#0F0F0F] transition-transform duration-300 ${
        isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
      }`}>
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors text-white"
          aria-label="Retour"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-base font-semibold absolute left-1/2 -translate-x-1/2">
          Histoire
        </h1>
        <div className="w-9" />
      </header>

      {/* Contenu principal */}
      <main className="px-4 md:px-8 pt-20 pb-24 max-w-2xl mx-auto w-full">
        <motion.p 
          className="text-[#A3A3A3] mb-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Uploadez une photo et décrivez le scénario pour créer votre histoire
        </motion.p>

        {/* Section Upload Photo */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-8">
            {!uploadFile ? (
              <label className="flex flex-col items-center gap-4 cursor-pointer">
                <div className="w-24 h-24 rounded-full bg-[#252525] flex items-center justify-center border-2 border-dashed border-[#3BB9FF]">
                  <Image className="w-12 h-12 text-[#3BB9FF]" />
                </div>
                <div className="text-center">
                  <p className="text-white font-medium mb-1">Cliquez pour sélectionner une photo</p>
                  <p className="text-[#A3A3A3] text-sm">JPG, PNG, WEBP</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <div className="relative w-full max-w-md">
                  <img
                    src={uploadFileUrl || undefined}
                    alt="Photo uploadée"
                    className="w-full h-auto rounded-xl object-cover max-h-96"
                  />
                  <button
                    onClick={handleRemovePhoto}
                    className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                    aria-label="Supprimer la photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <button
                  onClick={handleUploadClick}
                  className="text-sm text-[#3BB9FF] hover:underline"
                >
                  Changer la photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Section Description Scénario */}
        <motion.div 
          className="mb-6"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-[#3BB9FF]" />
              <h2 className="text-white font-medium">Décrivez le scénario</h2>
            </div>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="Décrivez l'histoire, le contexte, les personnages, l'ambiance..."
              className="w-full h-40 px-4 py-3 bg-[#252525] border border-[#2A2A2A] rounded-xl text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#3BB9FF] focus:border-transparent resize-none"
            />
            <p className="text-[#A3A3A3] text-xs mt-2">
              {scenario.length} caractères
            </p>
          </div>
        </motion.div>

        {/* Message d'erreur */}
        {error && (
          <motion.div 
            className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-200 text-sm mb-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
          >
            {error}
          </motion.div>
        )}

        {/* Message de succès */}
        {uploadState === "success" && (
          <motion.div 
            className="bg-green-500/20 border border-green-500/50 rounded-xl p-4 text-green-200 text-sm mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            Histoire créée avec succès ! Redirection...
          </motion.div>
        )}

        {/* Bouton Submit */}
        <motion.div 
          className="flex justify-end"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || uploadState === "uploading"}
            className={`py-2.5 px-6 font-medium rounded-xl transition-colors flex items-center gap-2 ${
              !canSubmit || uploadState === "uploading"
                ? "bg-[#252525] text-[#A3A3A3] cursor-not-allowed"
                : "bg-[#3BB9FF] text-white hover:bg-[#2AA3E6]"
            }`}
          >
            {uploadState === "uploading" ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Création en cours...
              </>
            ) : (
              "Créer"
            )}
          </button>
        </motion.div>
      </main>
    </div>
  );
}
