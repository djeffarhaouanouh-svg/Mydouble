"""
Wav2Lip API FastAPI - RunPod
Installer sur le pod: /workspace/api_fast.py
Lancer: uvicorn api_fast:app --host 0.0.0.0 --port 5000
Ou: python api_fast.py
"""

import os
import uuid
import subprocess
import requests
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="Wav2Lip API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
WAV2LIP_PATH = "/workspace/Wav2Lip"
CHECKPOINT_PATH = f"{WAV2LIP_PATH}/checkpoints/wav2lip_gan.pth"
OUTPUT_DIR = "/workspace/outputs"
TEMP_DIR = "/workspace/temp"

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)

class Wav2LipRequest(BaseModel):
    video_url: str
    audio_url: str

@app.get("/health")
def health():
    return {
        "status": "ok",
        "wav2lip_path": WAV2LIP_PATH,
        "checkpoint_exists": os.path.exists(CHECKPOINT_PATH)
    }

@app.post("/wav2lip")
async def wav2lip_files(video: UploadFile = File(...), audio: UploadFile = File(...)):
    try:
        job_id = str(uuid.uuid4())[:8]

        # Sauvegarder les fichiers
        video_path = f"{TEMP_DIR}/{job_id}_video.mp4"
        audio_path = f"{TEMP_DIR}/{job_id}_audio.wav"

        with open(video_path, "wb") as f:
            f.write(await video.read())

        with open(audio_path, "wb") as f:
            f.write(await audio.read())

        # Générer la vidéo
        output_path = f"{OUTPUT_DIR}/{job_id}_output.mp4"

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

        result = subprocess.run(
            cmd,
            cwd=WAV2LIP_PATH,
            capture_output=True,
            text=True,
            timeout=300
        )

        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=f"Wav2Lip failed: {result.stderr[-500:]}")

        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Video not generated")

        # Nettoyer
        cleanup_files([video_path, audio_path])

        return FileResponse(
            output_path,
            media_type="video/mp4",
            filename=f"wav2lip_{job_id}.mp4"
        )

    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Timeout")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/wav2lip-url")
async def wav2lip_url(request: Wav2LipRequest):
    try:
        job_id = str(uuid.uuid4())[:8]

        # Télécharger les fichiers
        video_path = download_file(request.video_url, f"{TEMP_DIR}/{job_id}_video.mp4")
        audio_path = download_file(request.audio_url, f"{TEMP_DIR}/{job_id}_audio.wav")

        # Générer la vidéo
        output_path = f"{OUTPUT_DIR}/{job_id}_output.mp4"

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

        result = subprocess.run(
            cmd,
            cwd=WAV2LIP_PATH,
            capture_output=True,
            text=True,
            timeout=300
        )

        if result.returncode != 0:
            raise HTTPException(status_code=500, detail=result.stderr[-500:])

        if not os.path.exists(output_path):
            raise HTTPException(status_code=500, detail="Video not generated")

        # Nettoyer
        cleanup_files([video_path, audio_path])

        return {
            "success": True,
            "job_id": job_id,
            "video_url": f"/output/{job_id}_output.mp4"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/output/{filename}")
def serve_output(filename: str):
    file_path = os.path.join(OUTPUT_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="video/mp4")
    raise HTTPException(status_code=404, detail="File not found")

def download_file(url: str, dest_path: str) -> str:
    print(f"Downloading: {url}")
    response = requests.get(url, stream=True, timeout=60)
    response.raise_for_status()

    with open(dest_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            f.write(chunk)

    print(f"Downloaded: {dest_path}")
    return dest_path

def cleanup_files(paths: list):
    for path in paths:
        try:
            if path and os.path.exists(path):
                os.remove(path)
        except Exception as e:
            print(f"Cleanup error: {e}")

if __name__ == "__main__":
    import uvicorn
    print("=" * 50)
    print("Wav2Lip FastAPI Server")
    print("=" * 50)
    print(f"WAV2LIP_PATH: {WAV2LIP_PATH}")
    print(f"CHECKPOINT: {CHECKPOINT_PATH}")
    print(f"Checkpoint exists: {os.path.exists(CHECKPOINT_PATH)}")
    print("=" * 50)
    uvicorn.run(app, host="0.0.0.0", port=5000)
