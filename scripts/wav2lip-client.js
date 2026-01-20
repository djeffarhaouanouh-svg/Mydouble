// URL de ton API (utilise .env.local WAV2LIP_API_URL en prod)
const WAV2LIP_API = 'https://proprietary-passport-bras-confidence.trycloudflare.com';

/**
 * Générer une vidéo avec lip-sync
 * @param {File} videoFile - Fichier vidéo/image (avatar)
 * @param {File} audioFile - Fichier audio (voix ElevenLabs)
 * @returns {Promise<Blob>} - Vidéo générée
 */
async function generateWav2Lip(videoFile, audioFile) {
    try {
        // Créer FormData
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('audio', audioFile);

        console.log('Envoi de la requête à l\'API Wav2Lip...');

        // Appeler l'API
        const response = await fetch(`${WAV2LIP_API}/wav2lip`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.detail || 'Erreur lors de la génération');
        }

        // Récupérer la vidéo
        const videoBlob = await response.blob();
        console.log('Vidéo générée avec succès !', videoBlob);

        return videoBlob;

    } catch (error) {
        console.error('Erreur Wav2Lip:', error);
        throw error;
    }
}

/**
 * Générer une vidéo avec URLs (pour ElevenLabs)
 * @param {string} videoUrl - URL de la vidéo/image source
 * @param {string} audioUrl - URL de l'audio (ElevenLabs)
 * @returns {Promise<string>} - URL de la vidéo générée
 */
async function generateWav2LipFromURLs(videoUrl, audioUrl) {
    try {
        console.log('Génération avec URLs...', { videoUrl, audioUrl });

        const response = await fetch(`${WAV2LIP_API}/wav2lip-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                video_url: videoUrl,
                audio_url: audioUrl
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Erreur lors de la génération');
        }

        const result = await response.json();
        console.log('Vidéo générée:', result);

        // L'API retourne directement l'URL complète
        return result.video_url;

    } catch (error) {
        console.error('Erreur Wav2Lip:', error);
        throw error;
    }
}

// ============================================
// EXEMPLE D'UTILISATION
// ============================================

// Exemple 1 : Upload de fichiers
document.getElementById('generateBtn')?.addEventListener('click', async () => {
    const videoInput = document.getElementById('videoInput');
    const audioInput = document.getElementById('audioInput');

    if (!videoInput.files[0] || !audioInput.files[0]) {
        alert('Sélectionne une vidéo et un audio !');
        return;
    }

    try {
        const videoBlob = await generateWav2Lip(
            videoInput.files[0],
            audioInput.files[0]
        );

        // Afficher la vidéo
        const videoUrl = URL.createObjectURL(videoBlob);
        const videoElement = document.getElementById('resultVideo');
        videoElement.src = videoUrl;
        videoElement.play();

        // Télécharger
        const downloadLink = document.createElement('a');
        downloadLink.href = videoUrl;
        downloadLink.download = 'avatar_lipsync.mp4';
        downloadLink.click();

    } catch (error) {
        alert('Erreur : ' + error.message);
    }
});

// Exemple 2 : Avec ElevenLabs (URLs)
async function createAvatarWithVoice(avatarImageUrl, elevenLabsAudioUrl) {
    try {
        // Générer la vidéo avec lip-sync
        const videoUrl = await generateWav2LipFromURLs(
            avatarImageUrl,
            elevenLabsAudioUrl
        );

        console.log('Vidéo disponible à:', videoUrl);

        // Afficher la vidéo
        const videoElement = document.getElementById('avatarVideo');
        videoElement.src = videoUrl;
        videoElement.play();

        return videoUrl;

    } catch (error) {
        console.error('Erreur:', error);
        throw error;
    }
}

// ============================================
// INTÉGRATION AVEC TON SYSTÈME BESPONA
// ============================================

// Fonction pour générer un avatar parlant avec ElevenLabs
async function generateTalkingAvatar(creatorName, textToSpeak) {
    try {
        // 1. Récupérer l'image de l'avatar (Sophia, Emma, Luna)
        const avatarImageUrl = `/avatars/${creatorName}.jpg`;

        // 2. Générer l'audio avec ElevenLabs
        const elevenLabsAudioUrl = await generateElevenLabsAudio(textToSpeak);

        // 3. Créer la vidéo avec lip-sync
        const videoUrl = await generateWav2LipFromURLs(
            avatarImageUrl,
            elevenLabsAudioUrl
        );

        return videoUrl;

    } catch (error) {
        console.error('Erreur génération avatar:', error);
        throw error;
    }
}

// Fonction pour générer l'audio ElevenLabs (à adapter selon ton code)
async function generateElevenLabsAudio(text) {
    // Ton code ElevenLabs existant ici
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID', {
        method: 'POST',
        headers: {
            'xi-api-key': 'YOUR_ELEVENLABS_KEY',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            text: text,
            model_id: 'eleven_multilingual_v2'
        })
    });

    const audioBlob = await response.blob();

    // Uploader l'audio quelque part et retourner l'URL
    // Ou utiliser un blob URL temporaire
    return URL.createObjectURL(audioBlob);
}
