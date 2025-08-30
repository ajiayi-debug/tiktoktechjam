from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from pathlib import Path
import shutil

app = FastAPI(title="Red Teaming Privacy")

# Allow your frontend origin(s)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = Path("uploads")
(UPLOAD_DIR / "images").mkdir(parents=True, exist_ok=True)
(UPLOAD_DIR / "videos").mkdir(parents=True, exist_ok=True)

# ---------- TEXT ----------
class UserDescIn(BaseModel):
    username: str = Field(..., min_length=1, max_length=64)
    description: str = Field(..., min_length=1, max_length=10_000)

@app.post("/submit/text")
async def submit_text(payload: UserDescIn):
    return {
        "ok": True,
        "username": payload.username.strip(),
        "description_len": len(payload.description),
    }
# ---------- IMAGE ----------
IMAGE_TYPES = {"image/png", "image/jpeg", "image/webp", "image/gif"}

@app.post("/upload/image")
async def upload_image(file: UploadFile = File(...), note: Optional[str] = None):
    if file.content_type not in IMAGE_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {file.content_type}")
    dest = UPLOAD_DIR / "images" / file.filename
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    return {
        "ok": True,
        "filename": file.filename,
        "content_type": file.content_type,
        "bytes": dest.stat().st_size,
        "note": note,
        "path": str(dest),
    }

# ---------- VIDEO ----------
VIDEO_TYPES = {
    "video/mp4",
    "video/quicktime",   # .mov
    "video/webm",
    "video/x-matroska",  # .mkv (often)
}

@app.post("/upload/video")
async def upload_video(file: UploadFile = File(...), caption: Optional[str] = None):
    if file.content_type not in VIDEO_TYPES:
        raise HTTPException(status_code=400, detail=f"Unsupported video type: {file.content_type}")
    dest = UPLOAD_DIR / "videos" / file.filename
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    return {
        "ok": True,
        "filename": file.filename,
        "content_type": file.content_type,
        "bytes": dest.stat().st_size,
        "caption": caption,
        "path": str(dest),
    }