from google.adk.agents import Agent
from google.adk.tools import google_search, url_context
import os
import certifi
from dotenv import load_dotenv
from prompt import WEBSEARCH, QUERY_GENERATE,EXTRACT_INFO,SYNTHESIZE,EVIDENCE
from google.adk.agents import SequentialAgent
load_dotenv()

os.environ['SSL_CERT_FILE'] = certifi.where()

# variation_agent = Agent(
#     name="variation_agent",
#     model="gemini-2.0-flash",
#     description="Agent to make variations of user's username.",
#     instruction=VARIATION,
#     output_key="variations"
# )

info_extractor = Agent(
    name="info_extractor_agent",
    model="gemini-2.0-flash", 
    description="Agent to extract structured information from the user's initial query.",
    instruction=EXTRACT_INFO,
    output_key="extracted_info"
)
query_generator = Agent(
    name="query_generator_agent",
    model="gemini-2.5-pro",
    description="Agent to generate effective search queries based on extracted user info and username variations.",
    instruction=QUERY_GENERATE,
    output_key="refined_queries",
)
search_and_find = Agent(
    name="search_and_find_agent",
    model="gemini-2.5-pro", # Use Pro for better reasoning and tool use
    description="Agent to execute search queries and identify potential social media profiles.",
    instruction=WEBSEARCH,
    tools=[google_search],
    output_key="search_results"
)

synthesis_and_report = Agent(
    name="synthesis_and_report_agent",
    model="gemini-2.5-pro", # Needs the best model for the final report
    description="Agent that analyzes found social media profiles and generates a final privacy report.",
    instruction=SYNTHESIZE,
    output_key="final_report",
    tools=[google_search] # It uses search to find the URLS and url_context to look into the URLs
)

supporting_evidence=Agent(
    name="supporting_evidence_agent",
    model="gemini-2.5-pro",
    description="Agent that finds supporting evidence for the final report.",
    instruction=EVIDENCE,
    output_key="supporting_evidence",
    tools=[google_search,url_context]
)

footprint_pipeline = SequentialAgent(
    name="footprint_pipeline",
    sub_agents=[
        info_extractor,
        query_generator,
        search_and_find,
        synthesis_and_report,
        supporting_evidence
    ]
)