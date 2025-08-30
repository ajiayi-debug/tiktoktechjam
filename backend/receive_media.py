import base64
from typing import Optional
from fastapi import FastAPI, File, Request, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Base64Bytes

app = FastAPI(title="Red Teaming Privacy")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UploadModel(BaseModel):
    username: str
    text: str
    video: Optional[Base64Bytes] = None
    video_extension: Optional[str] = None
    image: Optional[Base64Bytes] = None
    image_extension: Optional[str] = None


VALID_EXTENSIONS = {
    "image": [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "bmp",
        "tiff",
        "tif",
        "webp",
        "svg",
        "heif",
        "heic",
        "ico",
    ],
    "video": [
        "mp4",
        "avi",
        "mov",
        "mkv",
        "flv",
        "wmv",
        "webm",
        "mpeg",
        "mpg",
        "3gp",
        "m4v",
    ],
}


def validate_extension(ext: str, category: str) -> None:
    if ext.lower() not in VALID_EXTENSIONS.get(category, []):
        raise ValueError(
            f"Invalid {category} extension: .{ext}. "
            f"Allowed: {', '.join(VALID_EXTENSIONS[category])}"
        )


def save_file(payload: bytes, file_path: str):
    with open(f"{file_path}", "wb") as file:
        file.write(payload)


@app.post("/upload")
async def privacy_handler(payload: UploadModel):
    print(f"Recieved artifacts from {payload.username}")
    print(f"text:\n {payload.text}")

    if payload.video is not None and payload.video_extension is not None:
        validate_extension(payload.video_extension, "video")
        save_file(payload.video, f"video.{payload.video_extension}")

    if payload.image is not None and payload.image_extension is not None:
        validate_extension(payload.image_extension, "image")
        save_file(payload.image, f"image.{payload.image_extension}")
