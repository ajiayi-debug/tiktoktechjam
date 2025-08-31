import base64
from typing import Optional
from fastapi import FastAPI, File, Request, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Base64Bytes
from google.adk.runners import Runner
import json
import re
from google.adk.sessions import InMemorySessionService
import asyncio
from agents.agent import agentic_pipeline
from google.genai import types
from tools.text_extraction import ExtractionText
import logging
from pathlib import Path
import traceback
from google.protobuf import struct_pb2
from runner import setup_session_and_runner

logging.basicConfig(level=logging.INFO)


def extract_json_from_text(text: str):
    """
    Extract JSON strictly from inside a fenced ```javascript ...``` block.
    Returns dict if valid JSON is found, else None.
    """
    if not text:
        return None

    match = re.search(r"```javascript\s*([\s\S]*?)\s*```", text, re.IGNORECASE)
    if not match:
        return None

    block = match.group(1).strip()
    try:
        return json.loads(block)
    except json.JSONDecodeError:
        return None


def generate_text_extraction_prompt(video=True, username=str):
    """
    Extracts audio from videos then text from audio then combines video audio and video description into a single prompt.
    Arguments:
    video (bool) (True means media is a video, need to extract audio then text from video. False means no extraction needed.)
    username (str) (The TikTok username to be included in the prompt.)
    """
    if video:
        prompt = ExtractionText(
            username=username,
            video_path="video.mp4",
            description_path="description.txt",
            out_prefix="output2",
            audio_filename="output2.wav",
            overwrite=True,
        ).run()["combined_text"]
    else:
        prompt = Path("description/description2.txt").read_text(encoding="utf-8")
        prompt = "Tik Tok username:" + username + ", media description: " + prompt

    return prompt


media_path_to_analyze = "video.mp4"

APP_NAME = "Info Dig"
USER_ID = "user1234"
SESSION_ID = "1234"

app = FastAPI(title="Red Teaming Privacy")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=False,
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

    if payload.text is not None:
        with open("description.txt", "w") as file:
            file.write(payload.text)

    prompt = generate_text_extraction_prompt(video=True, username=payload.username)

    content = types.Content(role="user", parts=[types.Part(text=prompt)])

    session, runner = await setup_session_and_runner()
    events = runner.run_async(
        user_id=USER_ID,
        session_id=SESSION_ID,
        new_message=content,
        state_delta={"text": prompt, "media_path": prompt},
    )

    try:
        async for event in events:
            if event.is_final_response():
                final_response = event.content.parts[0].text
                print("Agent Response: ", final_response)
                print(final_response)

                with open("findings.txt", "a", encoding="utf-8") as f:
                    f.write(final_response + "\n\n---\n\n")

    except Exception as e:
        print("\n--- DETAILED ERROR ---")
        print(f"An error occurred during agent execution: {type(e).__name__} - {e}")
        if isinstance(e, ExceptionGroup):
            for i, sub_error in enumerate(e.exceptions):
                print(f"\n--- Sub-exception #{i + 1} ---")
                traceback.print_exception(
                    type(sub_error), sub_error, sub_error.__traceback__
                )
        else:
            traceback.print_exc()

    try:
        with open("findings.txt", "r") as file:
            text = file.read()

            json_response = extract_json_from_text(text)
            print("SEND TO FE\n")
            print(json_response)
            return json_response

    except Exception as e:
        print("\n--- DETAILED ERROR ---")
        print(f"An error occurred during agent execution: {type(e).__name__} - {e}")
        if isinstance(e, ExceptionGroup):
            for i, sub_error in enumerate(e.exceptions):
                print(f"\n--- Sub-exception #{i + 1} ---")
                traceback.print_exception(
                    type(sub_error), sub_error, sub_error.__traceback__
                )
        else:
            traceback.print_exc()
