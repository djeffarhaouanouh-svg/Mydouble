"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, X, Image as ImageIcon, AlertCircle, CheckCircle2 } from "lucide-react";

interface Etape1Props {
  data: any;
  onUpdate: (updates: any) => void;
  onNext: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export default function Etape1Style({ data, onUpdate, onNext, isLoading, setIsLoading }: Etape1Props) {
  const [screenshots, setScreenshots] = useState<File[]>(data.styleScreenshots || []);
  const [dragActive, setDragActive] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );

    if (files.length > 0) {
      addScreenshots(files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      addScreenshots(files);
    }
  };

  const addScreenshots = (files: File[]) => {
    const newScreenshots = [...screenshots, ...files].slice(0, 10); // Max 10 captures
    setScreenshots(newScreenshots);
    setError(null);
  };

  const removeScreenshot = (index: number) => {
    setScreenshots(screenshots.filter((_, i) => i !== index));
    setAnalysisResult(null);
  };

  const analyzeStyle = async () => {
    if (screenshots.length === 0) {
      setError("Tu dois uploader au moins une capture d'écran");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('Tu dois être connecté');
      }

      const formData = new FormData();
      formData.append('userId', userId);
      screenshots.forEach((file) => {
        formData.append("screenshots", file);
      });

      const response = await fetch("/api/double-ia/analyze-style", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'analyse");
      }

      const result = await response.json();
      setAnalysisResult(result.styleRules);
      onUpdate({ styleScreenshots: screenshots, styleRules: result.styleRules });
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = async () => {
    // Si pas encore analysé, analyser d'abord
    if (!analysisResult && screenshots.length > 0) {
      setIsLoading(true);
      setError(null);

      try {
        const userId = localStorage.getItem('userId');
        if (!userId) {
          throw new Error('Tu dois être connecté');
        }

        const formData = new FormData();
        formData.append('userId', userId);
        screenshots.forEach((file) => {
          formData.append("screenshots", file);
        });

        const response = await fetch("/api/double-ia/analyze-style", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Erreur lors de l'analyse");
        }

        const result = await response.json();
        setAnalysisResult(result.styleRules);
        onUpdate({ styleScreenshots: screenshots, styleRules: result.styleRules });
        
        // Continuer après l'analyse
        onNext();
      } catch (err: any) {
        setError(err.message || "Une erreur est survenue");
      } finally {
        setIsLoading(false);
      }
    } else if (analysisResult) {
      // Si déjà analysé, continuer directement
      onNext();
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">
            Apprends-moi ton{" "}
            <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">
              style d'écriture
            </span>
          </h2>
          <p className="text-gray-600">
            Upload des captures d'écran de tes conversations (WhatsApp, Instagram, SMS...).
            L'IA va analyser comment tu écris.
          </p>
        </div>

        {/* Upload Zone */}
        <div
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
            dragActive
              ? "border-[#e31fc1] bg-[#e31fc1]/5"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            multiple
            accept="image/*"
            onChange={handleFileInput}
            className="hidden"
          />

          <label htmlFor="file-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                <Upload className="w-8 h-8 text-[#e31fc1]" />
              </div>
              <div>
                <p className="text-black font-semibold mb-1">
                  Clique ou glisse tes captures ici
                </p>
                <p className="text-sm text-gray-500">
                  PNG, JPG jusqu'à 10 images (max 5MB chacune)
                </p>
              </div>
            </div>
          </label>
        </div>

        {/* Screenshots Preview */}
        {screenshots.length > 0 && (
          <div className="mt-6">
            <p className="text-sm text-gray-600 mb-3">
              {screenshots.length} capture{screenshots.length > 1 ? "s" : ""} uploadée{screenshots.length > 1 ? "s" : ""}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {screenshots.map((file, index) => (
                <div
                  key={index}
                  className="relative group aspect-square rounded-lg overflow-hidden bg-gray-100"
                >
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Capture ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => removeScreenshot(index)}
                    className="absolute top-2 right-2 w-6 h-6 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-black" />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                    <p className="text-xs text-black truncate">{file.name}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* Analysis Result */}
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20"
          >
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-green-400 font-semibold mb-2">
                  Analyse terminée !
                </p>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>• Longueur des messages: <span className="text-black font-semibold">{analysisResult.message_length}</span></p>
                  <p>• Utilisation d'emojis: <span className="text-black font-semibold">{analysisResult.emoji_frequency}</span></p>
                  <p>• Style: <span className="text-black font-semibold">{analysisResult.language_level}</span></p>
                  <p>• Messages analysés: <span className="text-black font-semibold">{analysisResult.total_messages || "~50"}</span></p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-300">
            💡 <strong>Astuce :</strong> Plus tu uploads de captures variées (différentes personnes, contextes),
            plus l'analyse sera précise. Pas besoin d'upload tes conversations privées - juste des exemples de ton style !
          </p>
        </div>

        {/* Continue Button */}
        {screenshots.length > 0 && (
          <div className="mt-8">
            <button
              onClick={handleContinue}
              disabled={isLoading}
              className="w-full py-4 rounded-lg bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] text-black font-bold hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? "Analyse en cours..." : "Continuer →"}
            </button>
          </div>
        )}

        {/* Skip Button */}
        {!analysisResult && (
          <div className="mt-8">
            <button
              onClick={() => {
                // Passer avec des données mock
                onUpdate({
                  styleScreenshots: [],
                  styleRules: {
                    message_length: "medium",
                    emoji_frequency: "medium",
                    language_level: "casual",
                    total_messages: 0,
                  },
                });
                onNext();
              }}
              className="w-full py-3 rounded-lg border-2 border-gray-300 text-gray-600 font-semibold hover:border-gray-400 hover:text-gray-300 transition-colors"
            >
              Passer cette étape →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
