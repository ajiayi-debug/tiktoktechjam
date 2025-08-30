from google.adk.agents import Agent
from tools.pii_tool import run_pii_analysis

MEDIA_PII_PROMPT = """
You are a media privacy analysis agent. Your sole purpose is to analyze a local media file for PII.
You will be given a file path as input.
1. Use the `run_pii_analysis` tool with the provided `media_path`.
2. Output the complete JSON report returned by the tool.

Input: {media_path}
"""

# --- Define the Media PII Agent ---
media_pii_agent = Agent(
    name="MediaPiiAgent",
    model="gemini-2.0-flash", 
    description="An agent that runs an on-device analysis of a media file to detect PII.",
    instruction=MEDIA_PII_PROMPT,
    tools=[run_pii_analysis],
    output_key="pii_report" 
)