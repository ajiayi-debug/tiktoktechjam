from urllib import response
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
import asyncio
from agents.websearch import footprint_pipeline
import os
from google.genai import types
from tools.text_extraction import ExtractionText
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)


# video_file_path = "media/video1.mp4"
# audio_file_path = "media/output1.wav"
# output = "output1"
# ae=AudioExtractor()
# ae.extract_audio(video_file_path, audio_file_path)
# logging.info("Audio extracted successfully.")
# stt = SpeechToText()
# stt.transcribe_audio(audio_file_path, output)
# logging.info("Transcription completed successfully.")
# ti=TextInput()
# prompt=ti.input_text_prompt("kiwiiclaire", "description/description1.txt", "description/output1.txt")
# logging.info("Text input prepared successfully.")


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
            video_path="media/video2.MOV",
            description_path="description/description2.txt",
            out_prefix="output2",
            audio_filename="output2.wav",
            overwrite=True,
        ).run()["combined_text"]
    else:
        prompt = Path("description/description2.txt").read_text(encoding="utf-8")
        prompt = "Tik Tok username:" + username + ", media description: " + prompt

    return prompt


prompt = generate_text_extraction_prompt(video=True, username="koji.and.yuki")


APP_NAME = "google_search_agent"
USER_ID = "user1234"
SESSION_ID = "1234"


# Session and Runner
async def setup_session_and_runner():
    session_service = InMemorySessionService()
    session = await session_service.create_session(
        app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID
    )
    runner = Runner(
        agent=footprint_pipeline, app_name=APP_NAME, session_service=session_service
    )
    return session, runner


# Agent Interaction
async def call_agent_async(query):
    if not query.strip():
        raise ValueError("Query cannot be empty")

    # 1) Truncate file at the START of the run
    Path("findings.txt").write_text("", encoding="utf-8")

    content = types.Content(role="user", parts=[types.Part(text=query)])
    session, runner = await setup_session_and_runner()
    events = runner.run_async(
        user_id=USER_ID, session_id=SESSION_ID, new_message=content
    )

    try:
        async for event in events:
            if event.is_final_response():
                final_response = event.content.parts[0].text
                print("Agent Response: ", final_response)

                # 2) Append each agent’s final output for THIS run
                with open("findings.txt", "a", encoding="utf-8") as f:
                    f.write(final_response + "\n\n---\n\n")
    except Exception as e:
        print(f"Error during agent execution: {str(e)}")
