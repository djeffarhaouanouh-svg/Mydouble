'use client';

import { useState, useRef } from 'react';
import { Upload, Mic, Loader2, Check, Camera, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface VisioSetupProps {
  userId: string;
  hasExistingVoice: boolean;
  onComplete: () => void;
}

type Step = 'photo' | 'voice' | 'personality' | 'creating';

export function VisioSetup({ userId, hasExistingVoice, onComplete }: VisioSetupProps) {
  const [step, setStep] = useState<Step>('photo');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [voiceOption, setVoiceOption] = useState<'existing' | 'upload' | 'none'>('none');
  const [voiceSample, setVoiceSample] = useState<File | null>(null);
  const [personalityPrompt, setPersonalityPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const voiceInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVoiceSample(file);
      setVoiceOption('upload');
    }
  };

  const handleSubmit = async () => {
    if (!photo) {
      setError('Veuillez uploader une photo');
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep('creating');

    try {
      // 1. Upload les fichiers
      const formData = new FormData();
      formData.append('userId', userId);
      formData.append('photo', photo);
      formData.append('useExistingVoice', voiceOption === 'existing' ? 'true' : 'false');

      if (voiceSample) {
        formData.append('voiceSample', voiceSample);
      }

      if (personalityPrompt) {
        formData.append('personalityPrompt', personalityPrompt);
      }

      const uploadResponse = await fetch('/api/avatar-visio/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        const err = await uploadResponse.json();
        throw new Error(err.error || 'Erreur lors de l\'upload');
      }

      // 2. Créer l'avatar HeyGen
      const createResponse = await fetch('/api/avatar-visio/create-avatar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          personalityPrompt,
        }),
      });

      if (!createResponse.ok) {
        const err = await createResponse.json();
        throw new Error(err.error || 'Erreur lors de la création de l\'avatar');
      }

      // Succès
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      setStep('photo');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-6">
      <AnimatePresence mode="wait">
        {/* Étape 1: Photo */}
        {step === 'photo' && (
          <motion.div
            key="photo"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Configurez votre avatar
              </h2>
              <p className="text-gray-600">
                Uploadez une photo de vous (visage + buste visibles)
              </p>
            </div>

            {/* Zone d'upload */}
            <div
              onClick={() => photoInputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-2xl p-8 cursor-pointer
                transition-all hover:border-pink-400 hover:bg-pink-50
                ${photoPreview ? 'border-green-400 bg-green-50' : 'border-gray-300'}
              `}
            >
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />

              {photoPreview ? (
                <div className="flex flex-col items-center">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-40 h-40 object-cover rounded-xl mb-4"
                  />
                  <div className="flex items-center gap-2 text-green-600">
                    <Check className="w-5 h-5" />
                    <span className="font-medium">Photo sélectionnée</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Cliquez pour changer
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center text-gray-500">
                  <Camera className="w-12 h-12 mb-4" />
                  <p className="font-medium">Cliquez pour uploader une photo</p>
                  <p className="text-sm mt-1">JPG, PNG (max 10MB)</p>
                </div>
              )}
            </div>

            <button
              onClick={() => setStep('voice')}
              disabled={!photo}
              className={`
                w-full py-3 rounded-xl font-semibold transition-all
                ${photo
                  ? 'bg-gradient-to-r from-[#e31fc1] to-[#ff6b9d] text-white hover:scale-[1.02]'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              Continuer
            </button>
          </motion.div>
        )}

        {/* Étape 2: Voix */}
        {step === 'voice' && (
          <motion.div
            key="voice"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Configuration de la voix
              </h2>
              <p className="text-gray-600">
                Choisissez comment votre avatar va parler
              </p>
            </div>

            <div className="space-y-3">
              {/* Option 1: Voix existante */}
              {hasExistingVoice && (
                <button
                  onClick={() => setVoiceOption('existing')}
                  className={`
                    w-full p-4 rounded-xl border-2 text-left transition-all
                    ${voiceOption === 'existing'
                      ? 'border-pink-500 bg-pink-50'
                      : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center
                      ${voiceOption === 'existing' ? 'bg-pink-500 text-white' : 'bg-gray-100'}
                    `}>
                      <Check className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold">Utiliser ma voix clonée</p>
                      <p className="text-sm text-gray-500">
                        Votre voix déjà configurée dans MyDouble
                      </p>
                    </div>
                  </div>
                </button>
              )}

              {/* Option 2: Uploader une voix */}
              <button
                onClick={() => voiceInputRef.current?.click()}
                className={`
                  w-full p-4 rounded-xl border-2 text-left transition-all
                  ${voiceOption === 'upload'
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <input
                  ref={voiceInputRef}
                  type="file"
                  accept="audio/*"
                  onChange={handleVoiceChange}
                  className="hidden"
                />
                <div className="flex items-center gap-3">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${voiceOption === 'upload' ? 'bg-pink-500 text-white' : 'bg-gray-100'}
                  `}>
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">
                      {voiceSample ? voiceSample.name : 'Uploader un échantillon'}
                    </p>
                    <p className="text-sm text-gray-500">
                      MP3, WAV (30 secondes minimum)
                    </p>
                  </div>
                </div>
              </button>

              {/* Option 3: Voix par défaut */}
              <button
                onClick={() => {
                  setVoiceOption('none');
                  setVoiceSample(null);
                }}
                className={`
                  w-full p-4 rounded-xl border-2 text-left transition-all
                  ${voiceOption === 'none'
                    ? 'border-pink-500 bg-pink-50'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center
                    ${voiceOption === 'none' ? 'bg-pink-500 text-white' : 'bg-gray-100'}
                  `}>
                    <Volume2 className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold">Voix par défaut</p>
                    <p className="text-sm text-gray-500">
                      Utiliser une voix synthétique de qualité
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('photo')}
                className="flex-1 py-3 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Retour
              </button>
              <button
                onClick={() => setStep('personality')}
                className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-[#e31fc1] to-[#ff6b9d] text-white hover:scale-[1.02]"
              >
                Continuer
              </button>
            </div>
          </motion.div>
        )}

        {/* Étape 3: Personnalité */}
        {step === 'personality' && (
          <motion.div
            key="personality"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Personnalité de l'avatar
              </h2>
              <p className="text-gray-600">
                Décrivez comment votre avatar doit se comporter (optionnel)
              </p>
            </div>

            <textarea
              value={personalityPrompt}
              onChange={(e) => setPersonalityPrompt(e.target.value)}
              placeholder="Ex: Tu es un coach sportif motivant et énergique. Tu encourages toujours les gens à se dépasser..."
              className="w-full h-40 p-4 border-2 border-gray-200 rounded-xl resize-none focus:border-pink-400 focus:outline-none transition-colors"
            />

            <p className="text-sm text-gray-500 text-center">
              Si laissé vide, l'avatar utilisera votre profil MyDouble
            </p>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('voice')}
                className="flex-1 py-3 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Retour
              </button>
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="flex-1 py-3 rounded-xl font-semibold bg-gradient-to-r from-[#e31fc1] to-[#ff6b9d] text-white hover:scale-[1.02] disabled:opacity-50"
              >
                Créer l'avatar
              </button>
            </div>
          </motion.div>
        )}

        {/* Étape 4: Création en cours */}
        {step === 'creating' && (
          <motion.div
            key="creating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Loader2 className="w-16 h-16 mx-auto mb-6 text-pink-500 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Création en cours...
            </h2>
            <p className="text-gray-600">
              Votre avatar est en train d'être généré.
              <br />
              Cela peut prendre quelques instants.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
