from urllib import response
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
import asyncio
from websearch import footprint_pipeline
import os
from google.genai import types


APP_NAME="google_search_agent"
USER_ID="user1234"
SESSION_ID="1234"


# Session and Runner
async def setup_session_and_runner():
    session_service = InMemorySessionService()
    session = await session_service.create_session(app_name=APP_NAME, user_id=USER_ID, session_id=SESSION_ID)
    runner = Runner(agent=footprint_pipeline, app_name=APP_NAME, session_service=session_service)
    return session, runner

# Agent Interaction
async def call_agent_async(query):
    if not query.strip():
        raise ValueError("Query cannot be empty")
        
    content = types.Content(role='user', parts=[types.Part(text=query)])
    session, runner = await setup_session_and_runner()
    events = runner.run_async(user_id=USER_ID, session_id=SESSION_ID, new_message=content)

    try:
        async for event in events:
            if event.is_final_response():
                final_response = event.content.parts[0].text
                print("Agent Response: ", final_response)
                # Save to .txt
                with open(f"findings.txt", "a", encoding="utf-8") as f:
                    f.write(final_response)
    except Exception as e:
        print(f"Error during agent execution: {str(e)}")

description="description/description1.txt"
transcript="description/output1.txt"

with open(description, "r", encoding="utf-8") as f:
    description_content = f.read()

with open(transcript, "r", encoding="utf-8") as f:
    transcript_content = f.read()

asyncio.run(call_agent_async(f"""Tik Tok username: kiwiiclaire, media description: {description_content}, transcript: {transcript_content}"""))