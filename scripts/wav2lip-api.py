"""
Wav2Lip API Flask - RunPod
Installer sur le pod: /workspace/api.py
Lancer: python api.py
"""

import os
import sys
import uuid
import subprocess
import requests
import tempfile
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Configuration
WAV2LIP_PATH = "/workspace/Wav2Lip"
CHECKPOINT_PATH = f"{WAV2LIP_PATH}/checkpoints/wav2lip_gan.pth"
OUTPUT_DIR = "/workspace/outputs"
TEMP_DIR = "/workspace/temp"

# Creer les dossiers si necessaire
os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

@app.route('/health', methods=['GET'])
def health():
    """Endpoint de sante"""
    return jsonify({
        "status": "ok",
        "wav2lip_path": WAV2LIP_PATH,
        "checkpoint_exists": os.path.exists(CHECKPOINT_PATH)
    })

@app.route('/wav2lip', methods=['POST'])
def wav2lip():
    """
    Generer une video lip-sync

    Body JSON:
    - video_url: URL de la video/image source
    - audio_url: URL de l'audio

    OU FormData:
    - video: fichier video/image
    - audio: fichier audio
    """
    try:
        job_id = str(uuid.uuid4())[:8]

        # Recuperer les fichiers (URL ou upload)
        video_path = None
        audio_path = None

        if request.is_json:
            data = request.get_json()
            video_url = data.get('video_url')
            audio_url = data.get('audio_url')

            if not video_url or not audio_url:
                return jsonify({"error": "video_url et audio_url requis"}), 400

            # Telecharger les fichiers
            video_path = download_file(video_url, f"{TEMP_DIR}/{job_id}_video.mp4")
            audio_path = download_file(audio_url, f"{TEMP_DIR}/{job_id}_audio.mp3")
        else:
            # FormData
            if 'video' not in request.files or 'audio' not in request.files:
                return jsonify({"error": "video et audio requis"}), 400

            video_file = request.files['video']
            audio_file = request.files['audio']

            video_path = f"{TEMP_DIR}/{job_id}_video.mp4"
            audio_path = f"{TEMP_DIR}/{job_id}_audio.mp3"

            video_file.save(video_path)
            audio_file.save(audio_path)

        # Output path
        output_path = f"{OUTPUT_DIR}/{job_id}_output.mp4"

        # Executer Wav2Lip
        cmd = [
            "python", f"{WAV2LIP_PATH}/inference.py",
            "--checkpoint_path", CHECKPOINT_PATH,
            "--face", video_path,
            "--audio", audio_path,
            "--outfile", output_path,
            "--pads", "0", "10", "0", "0",
            "--resize_factor", "1",
            "--nosmooth"
        ]

        print(f"[{job_id}] Execution Wav2Lip...")
        print(f"[{job_id}] Commande: {' '.join(cmd)}")

        result = subprocess.run(
            cmd,
            cwd=WAV2LIP_PATH,
            capture_output=True,
            text=True,
            timeout=300  # 5 minutes max
        )

        if result.returncode != 0:
            print(f"[{job_id}] Erreur: {result.stderr}")
            return jsonify({
                "error": "Wav2Lip a echoue",
                "details": result.stderr[-500:] if result.stderr else "Erreur inconnue"
            }), 500

        if not os.path.exists(output_path):
            return jsonify({"error": "Video non generee"}), 500

        print(f"[{job_id}] Video generee: {output_path}")

        # Nettoyer les fichiers temp
        cleanup_files([video_path, audio_path])

        # Retourner la video
        return send_file(
            output_path,
            mimetype='video/mp4',
            as_attachment=True,
            download_name=f'wav2lip_{job_id}.mp4'
        )

    except subprocess.TimeoutExpired:
        return jsonify({"error": "Timeout - generation trop longue"}), 504
    except Exception as e:
        print(f"Erreur: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/wav2lip-url', methods=['POST'])
def wav2lip_url():
    """
    Generer une video lip-sync (SYNCHRONE)

    1 seul call -> attend -> retourne video_url
    PAS de job_id, PAS de polling

    Body JSON:
    - video_url: URL de la video/image source
    - audio_url: URL de l'audio

    Response:
    - success: true
    - video_url: URL complete de la video generee
    """
    try:
        file_id = str(uuid.uuid4())[:8]
        data = request.get_json()

        video_url = data.get('video_url')
        audio_url = data.get('audio_url')

        if not video_url or not audio_url:
            return jsonify({"error": "video_url et audio_url requis"}), 400

        # Telecharger les fichiers
        video_path = download_file(video_url, f"{TEMP_DIR}/{file_id}_video.mp4")
        audio_path = download_file(audio_url, f"{TEMP_DIR}/{file_id}_audio.mp3")

        # Output path
        output_filename = f"{file_id}_output.mp4"
        output_path = f"{OUTPUT_DIR}/{output_filename}"

        # Executer Wav2Lip (SYNCHRONE - attend la fin)
        cmd = [
            "python", f"{WAV2LIP_PATH}/inference.py",
            "--checkpoint_path", CHECKPOINT_PATH,
            "--face", video_path,
            "--audio", audio_path,
            "--outfile", output_path,
            "--pads", "0", "10", "0", "0",
            "--resize_factor", "1",
            "--nosmooth"
        ]

        print(f"[wav2lip] Traitement en cours...")

        result = subprocess.run(
            cmd,
            cwd=WAV2LIP_PATH,
            capture_output=True,
            text=True,
            timeout=300
        )

        if result.returncode != 0:
            print(f"[wav2lip] Erreur: {result.stderr}")
            return jsonify({
                "error": "Wav2Lip a echoue",
                "details": result.stderr[-500:] if result.stderr else "Erreur inconnue"
            }), 500

        if not os.path.exists(output_path):
            return jsonify({"error": "Video non generee"}), 500

        # Nettoyer les fichiers temp
        cleanup_files([video_path, audio_path])

        # Construire l'URL complete
        host = request.host_url.rstrip('/')
        full_video_url = f"{host}/output/{output_filename}"

        print(f"[wav2lip] OK -> {full_video_url}")

        # Retourner directement l'URL (PAS de job_id, PAS de polling)
        return jsonify({
            "success": True,
            "video_url": full_video_url
        })

    except subprocess.TimeoutExpired:
        return jsonify({"error": "Timeout - generation trop longue"}), 504
    except Exception as e:
        print(f"Erreur: {str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route('/output/<filename>', methods=['GET'])
def serve_output(filename):
    """Servir les videos generees"""
    file_path = os.path.join(OUTPUT_DIR, secure_filename(filename))
    if os.path.exists(file_path):
        return send_file(file_path, mimetype='video/mp4')
    return jsonify({"error": "Fichier non trouve"}), 404


def download_file(url: str, dest_path: str) -> str:
    """Telecharger un fichier depuis une URL"""
    print(f"Telechargement: {url}")
    response = requests.get(url, stream=True, timeout=60)
    response.raise_for_status()

    with open(dest_path, 'wb') as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

    print(f"Telecharge: {dest_path} ({os.path.getsize(dest_path)} bytes)")
    return dest_path


def cleanup_files(paths: list):
    """Supprimer les fichiers temporaires"""
    for path in paths:
        try:
            if path and os.path.exists(path):
                os.remove(path)
        except Exception as e:
            print(f"Erreur cleanup {path}: {e}")


if __name__ == '__main__':
    print("=" * 50)
    print("Wav2Lip API Server")
    print("=" * 50)
    print(f"WAV2LIP_PATH: {WAV2LIP_PATH}")
    print(f"CHECKPOINT: {CHECKPOINT_PATH}")
    print(f"Checkpoint existe: {os.path.exists(CHECKPOINT_PATH)}")
    print("=" * 50)

    # Lancer le serveur
    app.run(host='0.0.0.0', port=5000, debug=False)
