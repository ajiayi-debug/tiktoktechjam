from google.adk.agents import Agent, LlmAgent
import os
import certifi
from dotenv import load_dotenv
from .prompt import INFO_COMBINATION
from .websearch import footprint_pipeline
from google.adk.agents import SequentialAgent, ParallelAgent
from .media_agent import media_pii_agent
from soft_hints import soft_hints_evaluator

load_dotenv()

os.environ["SSL_CERT_FILE"] = certifi.where()


parallel_research_agent = ParallelAgent(
    name="ParallelWebResearchAgent",
    sub_agents=[footprint_pipeline, media_pii_agent, soft_hints_evaluator],
    description="Runs multiple research agents in parallel to gather information.",
)

summary = LlmAgent(
    name="SummaryAgent",
    description="Generates a summary report from the gathered information.",
    instruction=INFO_COMBINATION,
    model="gemini-2.5-pro",
)

agentic_pipeline = SequentialAgent(
    name="ResearchAndSynthesisPipeline",
    # Run parallel research first, then merge
    sub_agents=[parallel_research_agent, summary],
    description="Coordinates parallel research and synthesizes the results.",
)
