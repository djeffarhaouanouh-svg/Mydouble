"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Wand2, X } from "lucide-react";

// Options pour les attributs physiques
const ATTRIBUTE_OPTIONS = {
  ethnicite: {
    label: "Ethnicité",
    options: ["Occidentale", "Asiatique", "Africaine", "Latine", "Indienne", "Arabe", "Métisse"],
  },
  age: {
    label: "Âge",
    options: ["18 ans", "20 ans", "25 ans", "30 ans", "35 ans", "40 ans"],
  },
  couleurYeux: {
    label: "Couleur des yeux",
    options: ["Marron", "Bleu", "Vert", "Gris", "Noisette"],
  },
  typeCorps: {
    label: "Type de corps",
    options: ["Mince", "Moyenne", "Athlétique", "Pulpeuse"],
  },
  taillePoitrine: {
    label: "Taille de poitrine",
    options: ["Petite (A)", "Moyenne (B)", "Forte (C)", "Très forte (D)"],
  },
  coiffure: {
    label: "Coiffure",
    options: ["Lisse", "Frange", "Bouclé", "Chignon", "Court", "Attaché"],
  },
  couleurCheveux: {
    label: "Couleur de cheveux",
    options: ["Brune", "Blonde", "Noire", "Rousse", "Rose", "Blanche"],
  },
  vetements: {
    label: "Vêtements",
    options: ["Bikini", "Robe élégante", "Casual", "Lingerie", "Tenue de sport", "Tenue de soirée"],
  },
};

type AttributeKey = keyof typeof ATTRIBUTE_OPTIONS;

// Ordre: d'abord les attributs du visage, puis les attributs du corps
const ATTRIBUTE_KEYS: AttributeKey[] = [
  // Attributs visage (pour génération étape 1)
  "ethnicite",
  "age",
  "couleurYeux",
  "coiffure",
  "couleurCheveux",
  // Attributs corps (pour génération étape 2)
  "typeCorps",
  "taillePoitrine",
  "vetements",
];

function AvatarFXContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = searchParams.get("step") === "2" ? 2 : 1;
  const nameFromUrl = searchParams.get("name") ?? "";

  const [name, setName] = useState(step === 1 ? "" : nameFromUrl);
  const [isGenerating, setIsGenerating] = useState(false);
  const [importedImageUrl, setImportedImageUrl] = useState<string | null>(null);
  const [importedImageFile, setImportedImageFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [showImageOverlay, setShowImageOverlay] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // État pour les attributs physiques (step 2)
  const [attributeStep, setAttributeStep] = useState(0);
  const [selectedAttributes, setSelectedAttributes] = useState<Record<AttributeKey, string>>({
    ethnicite: "",
    age: "",
    couleurYeux: "",
    typeCorps: "",
    taillePoitrine: "",
    coiffure: "",
    couleurCheveux: "",
    vetements: "",
  });
  
  const displayName = step === 2 ? nameFromUrl || name : name;
  const isStep2 = step === 2;
  const currentAttributeKey = ATTRIBUTE_KEYS[attributeStep];
  const currentAttribute = ATTRIBUTE_OPTIONS[currentAttributeKey];
  const allAttributesSelected = ATTRIBUTE_KEYS.every((key) => selectedAttributes[key] !== "");

  const handleSubmitStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      router.push(`/avatar-fx?step=2&name=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleBack = () => {
    if (isStep2) {
      if (attributeStep > 0) {
        setAttributeStep(attributeStep - 1);
      } else {
        router.push("/avatar-fx");
      }
    } else {
      router.push("/");
    }
  };

  const handleSelectAttribute = (value: string) => {
    setSelectedAttributes((prev) => ({
      ...prev,
      [currentAttributeKey]: value,
    }));
  };

  const handleNextAttribute = () => {
    if (selectedAttributes[currentAttributeKey]) {
      // Passer à l'étape suivante (y compris l'étape résumé)
      setAttributeStep(attributeStep + 1);
    }
  };

  // Étape résumé = ATTRIBUTE_KEYS.length
  // Étape image générée = ATTRIBUTE_KEYS.length + 1
  const isSummaryStep = attributeStep === ATTRIBUTE_KEYS.length;
  const isGeneratedStep = attributeStep === ATTRIBUTE_KEYS.length + 1;

  const handleGenerateImage = async () => {
    if (!allAttributesSelected) return;

    const userId = localStorage.getItem('userId');
    if (!userId || userId.startsWith('user_') || userId.startsWith('temp_')) {
      setError('Vous devez être connecté pour générer un avatar');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attributes: selectedAttributes,
          name: displayName,
          userId: userId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Gérer l'erreur de crédits insuffisants
        if (data.errorCode === 'INSUFFICIENT_CREDITS') {
          setError(`Crédits insuffisants. Solde: ${data.currentBalance}, Requis: ${data.required}`);
        } else {
          setError(data.error || "Erreur lors de la génération");
        }
        return;
      }

      // Convertir l'URL en blob pour le stockage
      const imageResponse = await fetch(data.imageUrl);
      const blob = await imageResponse.blob();
      const file = new File([blob], "generated-avatar.png", { type: "image/png" });
      setImportedImageFile(file);
      setImportedImageUrl(URL.createObjectURL(blob));

      // Passer à l'étape image générée
      setAttributeStep(ATTRIBUTE_KEYS.length + 1);
    } catch (err) {
      console.error("Erreur génération:", err);
      setError(err instanceof Error ? err.message : "Erreur lors de la génération");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    return () => {
      if (importedImageUrl) URL.revokeObjectURL(importedImageUrl);
    };
  }, [importedImageUrl]);

  useEffect(() => {
    if (step === 1 && importedImageUrl) {
      URL.revokeObjectURL(importedImageUrl);
      setImportedImageUrl(null);
    }
  }, [step, importedImageUrl]);

  // Gérer la visibilité du header au scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
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

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    setImportedImageFile(file);
    setImportedImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  };

  const handleRemoveImage = () => {
    setImportedImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setImportedImageFile(null);
  };

  const handleSubmitStep2 = async (e?: React.FormEvent) => {
    e?.preventDefault();

    if (!displayName || !displayName.trim()) {
      setError('Le nom du personnage est requis');
      return;
    }

    const userId = localStorage.getItem('userId');
    if (!userId || userId.startsWith('user_') || userId.startsWith('temp_') || isNaN(Number(userId))) {
      setError('Vous devez être connecté pour créer un personnage');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      // Stocker les données du personnage temporairement en base64
      // La photo ne sera uploadée que lors de la création finale du personnage
      let photoBase64: string | null = null;

      if (importedImageFile) {
        // Convertir la photo en base64 pour le stockage temporaire
        const reader = new FileReader();
        photoBase64 = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Erreur lecture fichier'));
          reader.readAsDataURL(importedImageFile);
        });
      }

      // Générer une description à partir des attributs sélectionnés
      const attributeDescription = ATTRIBUTE_KEYS.map(
        (key) => `${ATTRIBUTE_OPTIONS[key].label}: ${selectedAttributes[key]}`
      ).join(", ");

      // Stocker les données dans localStorage pour les récupérer dans /voix
      const pendingCharacter = {
        name: displayName.trim(),
        description: attributeDescription,
        photoBase64: photoBase64,
        userId: userId,
        attributes: selectedAttributes,
      };
      localStorage.setItem('pendingCharacter', JSON.stringify(pendingCharacter));

      // Rediriger vers la page voix pour sélectionner la voix et finaliser la création
      router.push('/voix');
    } catch (err) {
      console.error('Erreur lors de la préparation du personnage:', err);
      setError(err instanceof Error ? err.message : 'Erreur lors de la préparation du personnage');
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Header - caché pendant la génération */}
      {!isGenerating && (
        <header className={`sticky top-0 z-50 flex items-center justify-between pl-3 pr-12 md:pl-4 md:pr-20 py-3 border-b border-[#2A2A2A] bg-[#0F0F0F] transition-transform duration-300 ${
          isHeaderVisible ? 'translate-y-0' : '-translate-y-full'
        }`}>
          <button
            type="button"
            onClick={handleBack}
            className="p-2 rounded-lg hover:bg-[#1A1A1A] transition-colors text-white"
            aria-label="Retour"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold absolute left-1/2 -translate-x-1/2">
            Créer un personnage
          </h1>
          <div className="w-9" />
        </header>
      )}

      {!isStep2 ? (
        /* Étape 1 : Nom */
        <main className="flex-1 px-12 md:px-20 pt-6 pb-6">
          <p className="text-white mb-3">
            Pour commencer, nous devons nommer votre personnage :
          </p>
          <form onSubmit={handleSubmitStep1} className="space-y-3">
            <div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom"
                className="w-full px-4 py-3 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#3BB9FF] focus:border-transparent"
                autoFocus
              />
              <p className="mt-1.5 text-sm text-[#A3A3A3]">
                Le nom peut inclure le nom et le prénom.
              </p>
            </div>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl text-white font-medium hover:bg-[#252525] hover:border-[#3BB9FF] transition-colors"
            >
              Suivant
            </button>
          </form>
        </main>
      ) : (
        /* Étape 2 : Sélection des attributs physiques */
        <main className="flex-1 px-6 md:px-20 pt-8 pb-24 flex flex-col">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />

          {/* Indicateur de progression - caché pendant la génération */}
          {!isGenerating && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#A3A3A3]">
                  {attributeStep < ATTRIBUTE_KEYS.length
                    ? `Étape ${attributeStep + 1} / ${ATTRIBUTE_KEYS.length}`
                    : isSummaryStep
                    ? "Résumé"
                    : "Génération terminée"}
                </span>
              </div>
              <div className="w-full h-2 bg-[#2A2A2A] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#3BB9FF] transition-all duration-300"
                  style={{
                    width: `${((Math.min(attributeStep, ATTRIBUTE_KEYS.length) + 1) / (ATTRIBUTE_KEYS.length + 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Génération en cours */}
          {isGenerating && (
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <div className="heart-loader" />
              <p className="text-white text-lg">Génération de {displayName} en cours...</p>
              <p className="text-[#A3A3A3] text-sm">Cela peut prendre quelques secondes</p>
              <style jsx>{`
                .heart-loader {
                  position: relative;
                  width: 60px;
                  height: 90px;
                  animation: heartBeat 1.2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
                  filter: drop-shadow(0 0 20px rgba(59, 185, 255, 0.6)) drop-shadow(0 0 40px rgba(59, 185, 255, 0.4));
                }
                .heart-loader:before,
                .heart-loader:after {
                  content: "";
                  background: linear-gradient(135deg, #5DD3FF 0%, #3BB9FF 50%, #2A9FE6 100%);
                  width: 60px;
                  height: 90px;
                  border-radius: 50px 50px 0 0;
                  position: absolute;
                  left: 0;
                  bottom: 0;
                  transform: rotate(45deg);
                  transform-origin: 50% 68%;
                  box-shadow:
                    inset 5px 4px 8px rgba(255, 255, 255, 0.3),
                    inset -2px -2px 6px rgba(0, 0, 0, 0.2);
                }
                .heart-loader:after {
                  transform: rotate(-45deg);
                }
                @keyframes heartBeat {
                  0% { transform: scale(0.95); filter: drop-shadow(0 0 20px rgba(59, 185, 255, 0.6)) drop-shadow(0 0 40px rgba(59, 185, 255, 0.4)); }
                  5% { transform: scale(1.1); filter: drop-shadow(0 0 30px rgba(59, 185, 255, 0.8)) drop-shadow(0 0 60px rgba(59, 185, 255, 0.5)); }
                  39% { transform: scale(0.85); filter: drop-shadow(0 0 15px rgba(59, 185, 255, 0.5)) drop-shadow(0 0 30px rgba(59, 185, 255, 0.3)); }
                  45% { transform: scale(1); filter: drop-shadow(0 0 25px rgba(59, 185, 255, 0.7)) drop-shadow(0 0 50px rgba(59, 185, 255, 0.45)); }
                  60% { transform: scale(0.95); filter: drop-shadow(0 0 20px rgba(59, 185, 255, 0.6)) drop-shadow(0 0 40px rgba(59, 185, 255, 0.4)); }
                  100% { transform: scale(0.9); filter: drop-shadow(0 0 18px rgba(59, 185, 255, 0.55)) drop-shadow(0 0 35px rgba(59, 185, 255, 0.35)); }
                }
              `}</style>
            </div>
          )}

          {/* Sélection des attributs */}
          {!isGenerating && attributeStep < ATTRIBUTE_KEYS.length && (
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-white mb-2">
                {currentAttribute.label}
              </h2>
              <p className="text-[#A3A3A3] mb-6">
                Choisissez {currentAttribute.label.toLowerCase()} pour {displayName}
              </p>

              <div className="grid grid-cols-2 gap-3">
                {currentAttribute.options.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => handleSelectAttribute(option)}
                    className={`py-4 px-4 rounded-xl text-left transition-all ${
                      selectedAttributes[currentAttributeKey] === option
                        ? "bg-[#3BB9FF] text-white border-2 border-[#3BB9FF]"
                        : "bg-[#1E1E1E] text-white border border-[#2A2A2A] hover:border-[#3BB9FF]"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Étape résumé - avant génération */}
          {!isGenerating && isSummaryStep && (
            <div className="flex-1 flex flex-col">
              <h2 className="text-xl font-semibold text-white mb-2">
                Résumé de {displayName}
              </h2>
              <p className="text-[#A3A3A3] mb-6">
                Vérifiez vos choix avant de générer l'avatar
              </p>

              {/* Résumé des attributs */}
              <div className="w-full bg-[#1E1E1E] rounded-xl p-4 border border-[#2A2A2A] mb-6">
                <h3 className="text-sm font-medium text-white mb-4">Attributs sélectionnés :</h3>
                <div className="space-y-3">
                  {ATTRIBUTE_KEYS.map((key) => (
                    <div key={key} className="flex justify-between items-center py-2 border-b border-[#2A2A2A] last:border-0">
                      <span className="text-[#A3A3A3]">{ATTRIBUTE_OPTIONS[key].label}</span>
                      <span className="text-white font-medium">{selectedAttributes[key]}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info crédits */}
              <div className="w-full bg-[#1E1E1E] rounded-xl p-4 border border-[#3BB9FF]/30 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-white">Coût de génération</span>
                  <span className="text-[#3BB9FF] font-bold text-lg">10 crédits</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setAttributeStep(0)}
                className="text-[#3BB9FF] hover:underline text-sm self-center"
              >
                Modifier les attributs
              </button>
            </div>
          )}

          {/* Image générée - étape finale */}
          {!isGenerating && isGeneratedStep && importedImageUrl && (
            <div className="flex-1 flex flex-col items-center">
              <h2 className="text-xl font-semibold text-white mb-4">
                Voici {displayName} !
              </h2>
              <div
                className="relative w-full max-w-[300px] aspect-square rounded-xl overflow-hidden bg-[#1E1E1E] border border-[#2A2A2A] mb-4 cursor-pointer"
                onClick={() => setShowImageOverlay(true)}
              >
                <img
                  src={importedImageUrl}
                  alt={`Avatar de ${displayName}`}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                  aria-label="Supprimer la photo"
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Overlay image plein écran */}
              {showImageOverlay && (
                <div
                  className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                  onClick={() => setShowImageOverlay(false)}
                >
                  <button
                    type="button"
                    onClick={() => setShowImageOverlay(false)}
                    aria-label="Fermer"
                    className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                  <img
                    src={importedImageUrl}
                    alt={`Avatar de ${displayName}`}
                    className="max-w-full max-h-full object-contain rounded-xl"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              {/* Résumé des attributs */}
              <div className="w-full bg-[#1E1E1E] rounded-xl p-4 border border-[#2A2A2A]">
                <h3 className="text-sm font-medium text-[#A3A3A3] mb-3">Attributs sélectionnés :</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {ATTRIBUTE_KEYS.map((key) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-[#A3A3A3]">{ATTRIBUTE_OPTIONS[key].label}:</span>
                      <span className="text-white">{selectedAttributes[key]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setAttributeStep(0);
                  handleRemoveImage();
                }}
                className="mt-4 text-[#3BB9FF] hover:underline text-sm"
              >
                Recommencer (5 crédits)
              </button>
            </div>
          )}

          {/* Message d'erreur */}
          {error && (
            <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-xl text-red-200 text-sm">
              {error}
              <button
                type="button"
                onClick={() => setError(null)}
                className="ml-2 underline"
              >
                Réessayer
              </button>
            </div>
          )}

          {/* Footer - caché pendant la génération */}
          {!isGenerating && (
            <footer className="fixed bottom-0 left-0 right-0 pl-4 pr-4 md:pl-6 md:pr-6 py-4 bg-[#0F0F0F] border-t border-[#2A2A2A] flex items-center justify-end pb-[max(1rem,env(safe-area-inset-bottom))]">
              {/* Bouton Suivant - pendant la sélection des attributs */}
              {attributeStep < ATTRIBUTE_KEYS.length && (
                <button
                  type="button"
                  onClick={handleNextAttribute}
                  disabled={!selectedAttributes[currentAttributeKey]}
                  className={`py-2.5 px-6 font-medium rounded-xl transition-colors flex items-center gap-2 ${
                    selectedAttributes[currentAttributeKey]
                      ? "bg-[#3BB9FF] text-white hover:bg-[#2AA3E6]"
                      : "bg-[#2A2A2A] text-[#6B7280] cursor-not-allowed"
                  }`}
                >
                  Suivant
                </button>
              )}

              {/* Bouton Générer - étape résumé */}
              {isSummaryStep && (
                <button
                  type="button"
                  onClick={handleGenerateImage}
                  className="py-2.5 px-6 font-medium rounded-xl transition-colors flex items-center gap-2 bg-[#3BB9FF] text-white hover:bg-[#2AA3E6]"
                >
                  <Wand2 className="w-4 h-4" />
                  Générer
                </button>
              )}

              {/* Bouton Continuer - après génération */}
              {isGeneratedStep && (
                <button
                  type="button"
                  onClick={() => handleSubmitStep2()}
                  disabled={isSaving || !importedImageUrl}
                  className="py-2.5 px-6 font-medium rounded-xl transition-colors flex items-center gap-2 bg-[#3BB9FF] text-white hover:bg-[#2AA3E6] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                      Création...
                    </>
                  ) : (
                    "Continuer"
                  )}
                </button>
              )}
            </footer>
          )}
        </main>
      )}
    </div>
  );
}

export default function AvatarFXPage() {
  return (
    <Suspense fallback={null}>
      <AvatarFXContent />
    </Suspense>
  );
}
