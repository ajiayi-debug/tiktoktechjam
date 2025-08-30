from urllib import response
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
import asyncio
from agents.agent import Overall_flow
import os
from google.genai import types
from tools.text_extraction import ExtractionText
import logging
from pathlib import Path
import traceback
from google.protobuf import struct_pb2

logging.basicConfig(level=logging.INFO)


prompt=ExtractionText(
    username="kiwiiclaire",
    video_path="video1.mp4",
    description_path="description1.txt",
    out_prefix="output1",
    audio_filename="output1.wav",
    overwrite=True,
).run()["combined_text"]

media_path_to_analyze = "video1.mp4"

APP_NAME="Info Dig"
USER_ID="user1234"
SESSION_ID="1234"

# Session and Runner
async def setup_session_and_runner():
    session_service = InMemorySessionService()
    session = await session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID)
    runner = Runner(agent=Overall_flow, app_name=APP_NAME, session_service=session_service)
    return session, runner

# Agent Interaction
async def call_agent_async(query:str, media_path: str):
    if not query.strip():
        raise ValueError("Query cannot be empty")
    if not Path(media_path).exists():
        raise FileNotFoundError(f"Media file not found at: {media_path}")

    # 1) Truncate file at the START of the run
    Path("findings.txt").write_text("", encoding="utf-8")

    input_data = {
        "text": query,
        "media_path": media_path
    }
    # Convert the dictionary to a Google Struct
    input_struct = struct_pb2.Struct()
    input_struct.update(input_data)
    
    content = types.Content(role='user', parts=[types.Part(text=query)])
    
    session, runner = await setup_session_and_runner()
    events = runner.run_async(user_id=USER_ID, session_id=SESSION_ID, new_message=content, state_delta={"text": query, "media_path": media_path})

    try:
        async for event in events:
            if event.is_final_response():
                final_response = event.content.parts[0].text
                print("Agent Response: ", final_response)
                print(final_response)

                # 2) Append each agent’s final output for THIS run
                with open("findings.txt", "a", encoding="utf-8") as f:
                    f.write(final_response + "\n\n---\n\n")
    except Exception as e:
        print("\n--- DETAILED ERROR ---")
        print(f"An error occurred during agent execution: {type(e).__name__} - {e}")
        # In Python 3.11+, TaskGroup errors are ExceptionGroups
        if isinstance(e, ExceptionGroup):
            for i, sub_error in enumerate(e.exceptions):
                print(f"\n--- Sub-exception #{i+1} ---")
                traceback.print_exception(type(sub_error), sub_error, sub_error.__traceback__)
        else:
            traceback.print_exc()



asyncio.run(call_agent_async(prompt, media_path_to_analyze))