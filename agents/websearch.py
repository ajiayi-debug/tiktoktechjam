from google.adk.agents import Agent
from google.adk.tools import google_search
import os
import certifi
from dotenv import load_dotenv
from prompt import WEBSEARCH, WEBSEARCH_REFINE
from google.adk.agents import SequentialAgent
load_dotenv()

os.environ['SSL_CERT_FILE'] = certifi.where()

refine_search_agent = Agent(
    name="refine_search_agent",
    model="gemini-2.5-pro",
    description="Agent to refine search query.",
    instruction=WEBSEARCH_REFINE,
    output_key="refined_queries",
)

search_agent = Agent(
    name="basic_search_agent",
    model="gemini-2.0-flash",
    description="Agent to answer questions using Google Search.",
    instruction=WEBSEARCH,
    # google_search is a pre-built tool which allows the agent to perform Google searches.
    tools=[google_search]
)

search_pipeline = SequentialAgent(name="search_pipeline", sub_agents=[refine_search_agent, search_agent])
