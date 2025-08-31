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

logging.basicConfig(level=logging.INFO)


def extract_json_from_text(text):
    patterns = [
        r"```javascript\s*(\{.*?\})\s*```",  # JavaScript code block
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            try:
                return json.loads(match.group(1))
            except json.JSONDecodeError:
                continue

    json_pattern = r"\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}"
    matches = re.findall(json_pattern, text)

    # Try parsing from the last match (most likely to be the summary)
    for match in reversed(matches):
        try:
            parsed = json.loads(match)
            # Verify it looks like the expected output
            if "id" in parsed or "agent" in parsed or "summary" in parsed:
                return parsed
        except json.JSONDecodeError:
            continue

    return None


media_path_to_analyze = "video.mp4"

APP_NAME = "Info Dig"
USER_ID = "user1234"
SESSION_ID = "1234"


async def setup_session_and_runner():
    session_service = InMemorySessionService()
    session = await session_service.create_session(
        app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID
    )
    runner = Runner(
        agent=agentic_pipeline, app_name=APP_NAME, session_service=session_service
    )
    return session, runner


async def call_agent_async(query: str, media_path: str):
    if not query.strip():
        raise ValueError("Query cannot be empty")
    if not Path(media_path).exists():
        raise FileNotFoundError(f"Media file not found at: {media_path}")

    # 1) Truncate file at the START of the run
    Path("findings.txt").write_text("", encoding="utf-8")

    input_data = {"text": query, "media_path": media_path}
    # Convert the dictionary to a Google Struct
    input_struct = struct_pb2.Struct()
    input_struct.update(input_data)

    content = types.Content(role="user", parts=[types.Part(text=query)])

    session, runner = await setup_session_and_runner()
    events = runner.run_async(
        user_id=USER_ID,
        session_id=SESSION_ID,
        new_message=content,
        state_delta={"text": query, "media_path": media_path},
    )

    try:
        async for event in events:
            if event.is_final_response():
                final_response = event.content.parts[0].text
                print("Agent Response: ", final_response)
                print(final_response)

                with open("findings.txt", "a", encoding="utf-8") as f:
                    f.write(final_response + "\n\n---\n\n")

                json_response = extract_json_from_text(final_response)
                print(json_response)
                # if json_response:
                #     return json_response
                # else:
                #     return {"raw_response": final_response, "status": "no_json_found"}
                #

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
