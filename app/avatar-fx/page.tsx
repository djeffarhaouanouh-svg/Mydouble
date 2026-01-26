"use client";

import { useState, Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Wand2, FolderUp, X } from "lucide-react";

function AvatarFXContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const step = searchParams.get("step") === "2" ? 2 : 1;
  const nameFromUrl = searchParams.get("name") ?? "";

  const [name, setName] = useState(step === 1 ? "" : nameFromUrl);
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [importedImageUrl, setImportedImageUrl] = useState<string | null>(null);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const displayName = step === 2 ? nameFromUrl || name : name;
  const isStep2 = step === 2;

  const handleSubmitStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) {
      router.push(`/avatar-fx?step=2&name=${encodeURIComponent(trimmed)}`);
    }
  };

  const handleBack = () => {
    if (isStep2) router.push("/avatar-fx");
    else router.push("/");
  };

  const handleGenerate = () => {
    if (!description.trim()) return;
    setIsGenerating(true);
    // TODO: appel API génération d'image
    setTimeout(() => setIsGenerating(false), 1500);
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

  const handleImport = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.value = "";
    fileInputRef.current.click();
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
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
  };

  const handleSubmitStep2 = (e?: React.FormEvent) => {
    e?.preventDefault();
    // Sauvegarder les données du personnage
    // TODO: Appel API pour sauvegarder le personnage
    console.log("Photo step done", { name: displayName, description, imageUrl: importedImageUrl });
    
    // Rediriger vers la page voix après création
    router.push('/voix');
  };

  return (
    <div className="min-h-screen bg-[#0F0F0F] text-white flex flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {/* Header */}
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
        /* Étape 2 : Photo */
        <main className="flex-1 px-12 md:px-20 pt-8 pb-24 flex flex-col">
          <p className="text-white mb-6">
            Attribuons une photo à {displayName || "votre personnage"}
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="hidden"
          />
          <form onSubmit={(e) => handleSubmitStep2(e)} className="flex flex-col flex-1">
            <div className="space-y-4 flex-1">
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`Décrivez à quoi ressemble ${displayName || "votre personnage"}`}
                className="w-full px-4 py-3.5 bg-[#1E1E1E] border border-[#2A2A2A] rounded-xl text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#3BB9FF] focus:border-transparent"
              />
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!description.trim() || isGenerating}
                className="w-full py-3.5 px-4 bg-[#E5E7EB] text-black font-medium rounded-xl flex items-center justify-center gap-2 border-2 border-[#3BB9FF] hover:bg-[#D1D5DB] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Wand2 className="w-5 h-5" />
                {isGenerating ? "Génération…" : "Générer"}
              </button>
              {importedImageUrl && (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative w-full max-w-[200px] aspect-square rounded-xl overflow-hidden bg-[#1E1E1E] border border-[#2A2A2A]">
                    <img
                      src={importedImageUrl}
                      alt="Photo importée"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      aria-label="Supprimer la photo"
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 flex items-center justify-center text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleImport}
                    className="text-sm text-[#3BB9FF] hover:underline"
                  >
                    Changer la photo
                  </button>
                </div>
              )}
              {!importedImageUrl && (
                <>
                  <p className="text-sm text-[#A3A3A3] text-center">
                    Vous pouvez également importer le vôtre
                  </p>
                  <button
                    type="button"
                    onClick={handleImport}
                    className="w-full py-3.5 px-4 bg-[#E5E7EB] text-black font-medium rounded-xl flex items-center justify-center gap-2 hover:bg-[#D1D5DB] transition-colors"
                  >
                    <FolderUp className="w-5 h-5" />
                    Importer
                  </button>
                </>
              )}
            </div>
          </form>

          {/* Footer Suivant */}
          <footer className="fixed bottom-0 left-0 right-0 pl-4 pr-4 md:pl-6 md:pr-6 py-4 bg-[#0F0F0F] border-t border-[#2A2A2A] flex items-center justify-end pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={() => handleSubmitStep2()}
              className={`py-2.5 px-6 font-medium rounded-xl transition-colors ${
                importedImageUrl
                  ? "bg-[#3BB9FF] text-white hover:bg-[#2AA3E6]"
                  : "bg-[#E5E7EB] text-black hover:bg-[#D1D5DB]"
              }`}
            >
              Suivant
            </button>
          </footer>
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
