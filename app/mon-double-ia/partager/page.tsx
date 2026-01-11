'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Copy, Check, Share2, Globe, Lock } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function PartageDoublePage() {
  const router = useRouter();
  const [doubleIA, setDoubleIA] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/login');
      return;
    }

    async function loadDouble() {
      try {
        const response = await fetch(`/api/double-ia/list?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          const activeDouble = data.doubles?.find((d: any) => d.status === 'active');

          if (activeDouble) {
            setDoubleIA(activeDouble);
            setIsPublic(activeDouble.is_public || false);
          } else {
            router.push('/mon-double-ia');
          }
        }
      } catch (error) {
        console.error('Error loading double:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDouble();
  }, [router]);

  const getShareUrl = () => {
    if (!doubleIA) return '';
    if (typeof window === 'undefined') return '';
    const slug = doubleIA.share_slug || doubleIA.id;
    return `${window.location.origin}/talk-to/${slug}`;
  };

  const shareUrl = getShareUrl();

  const copyToClipboard = async () => {
    const url = getShareUrl();
    if (!url) {
      alert('Le lien de partage n\'est pas encore disponible. Active d\'abord le partage public.');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Erreur lors de la copie:', err);
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Erreur fallback copie:', err);
        alert('Impossible de copier le lien. Veuillez le sélectionner manuellement.');
      }
      document.body.removeChild(textArea);
    }
  };

  const togglePublic = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId || !doubleIA) return;

    setUpdating(true);
    try {
      const response = await fetch('/api/double-ia/toggle-public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doubleId: doubleIA.id,
          userId,
          isPublic: !isPublic,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setIsPublic(!isPublic);
        if (data.shareSlug && doubleIA) {
          setDoubleIA({ ...doubleIA, share_slug: data.shareSlug });
        }
      }
    } catch (error) {
      console.error('Error toggling public:', error);
      alert('Erreur lors de la mise à jour du partage. Veuillez réessayer.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#e31fc1]"></div>
      </div>
    );
  }

  if (!doubleIA) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Aucun double IA trouvé</h1>
          <Link href="/mon-double-ia">
            <Button>Créer mon double IA</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/mon-double-ia')}
          >
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl font-bold">
            Partager mon <span className="bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] bg-clip-text text-transparent">Double IA</span>
          </h1>
        </div>

        {/* Status Card */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {isPublic ? (
                <>
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                    <Globe className="text-green-500" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Partage activé</h3>
                    <p className="text-sm text-gray-400">Tout le monde peut parler à ton double</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                    <Lock className="text-gray-400" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Partage désactivé</h3>
                    <p className="text-sm text-gray-400">Seul toi peux parler à ton double</p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={togglePublic}
              disabled={updating}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                isPublic ? 'bg-green-500' : 'bg-gray-700'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  isPublic ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {isPublic && (
            <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded-lg">
              <p className="text-sm text-green-400">
                ✓ Ton double IA est maintenant accessible publiquement via le lien ci-dessous
              </p>
            </div>
          )}
        </div>

        {/* Share Link */}
        {isPublic && (
          <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Share2 className="text-[#e31fc1]" size={20} />
              <h3 className="font-semibold">Lien de partage</h3>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1 px-4 py-3 bg-gray-800 rounded-lg text-sm text-gray-300 border border-gray-700"
              />
              <button
                onClick={copyToClipboard}
                className="px-6 py-3 rounded-lg bg-[#e31fc1] hover:bg-[#c11aa3] transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check size={18} />
                    Copié !
                  </>
                ) : (
                  <>
                    <Copy size={18} />
                    Copier
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-400 mt-3">
              Partage ce lien avec tes amis pour qu'ils puissent discuter avec ton double IA
            </p>
          </div>
        )}

        {/* Preview */}
        <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800">
          <h3 className="font-semibold mb-4">Aperçu</h3>
          <p className="text-sm text-gray-400 mb-4">
            Voici comment ton double apparaîtra aux visiteurs :
          </p>

          <Link
            href={shareUrl}
            target="_blank"
            className="block p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors border border-gray-700"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-[#e31fc1] via-[#ff6b9d] to-[#ffc0cb] flex items-center justify-center text-white font-bold">
                IA
              </div>
              <div>
                <p className="font-semibold">Double IA</p>
                <p className="text-xs text-green-500">En ligne</p>
              </div>
            </div>
            <p className="text-sm text-gray-400">
              Salut ! Je suis le double IA. Pose-moi des questions ! 😊
            </p>
          </Link>

          {isPublic && (
            <div className="mt-4">
              <Link href={shareUrl} target="_blank">
                <Button className="w-full">
                  Tester la page de partage
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
