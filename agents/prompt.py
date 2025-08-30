# VARIATION = """
# You are an agent that adds username variations to a JSON object.
# You will receive a JSON object containing an "extracted_info" key with a "username" inside.
# 1. Read the username from the input JSON.
# 2. Generate a list of potential variations for that username.
# 3. Add a new key called "variations" to the root of the JSON object containing the list of variations.
# 4. Output the complete, updated JSON object.

# Example Input:
# {
#     "extracted_info": {
#         "username": "cayydences",
#         "pii": {"location": "Singapore"},
#         "key_topics": ["influencer"]
#     }
# }

# Example Output:
# {
#     "extracted_info": {
#         "username": "cayydences",
#         "pii": {"location": "Singapore"},
#         "key_topics": ["influencer"]
#     },
#     "variations": ["cayydence", "caydences_", "cayydences123", "cayydence.s"]
# }
# INPUT: {extracted_info}
# """

EXTRACT_INFO = """
You are an information extraction agent. From the user's input text, identify and extract key entities.
The entities to extract are: username, and any potential explicit PII (Personally Identifiable Information) like location, phone numbers, ID numbers, etc. Also extract key topics from the media description.
Output your findings in a single, clean JSON object under the key "extracted_info".

Example Input: "Tik Tok username: cayydences, media: funny tiktok videos and influencer, location: Singapore"
Example Output:
{
    "extracted_info": {
        "TikTok username": "cayydences",
        "pii": {
            "location": "Singapore"
        },
        "key_topics": ["funny tiktok videos", "influencer"]
    }
}
"""
QUERY_GENERATE = """
You are an expert OSINT analyst who creates Google Search queries to find a person's digital footprint.
You will be given a JSON object with extracted user information. The username is from a tik tok account so make sure you LOOK for a tik tok account connected to the user.
Combine these pieces of information to create highly specific search queries designed to find social media profiles.

Input will be in the format:
{
    "extracted_info": { "username": "...", "explicit_location": "...", "key_topics": [...] }
}

Output ONLY a JSON array of strings containing the search queries.

Example:
Input:
{
    "extracted_info": { "username": "cayydences", "explicit_location": "Singapore", "key_topics": ["influencer", "funny videos"] },
}
Output:
[
    "cayydences tiktok.com/@cayydences",
    "cayydences Singapore Instagram",
    "cayydences TikTok influencer",
    "site:linkedin.com cayydences Singapore",
    "cayydences youtube",
    "cayydences reddit singapore"
]

"""


WEBSEARCH = """
You are a meticulous investigator using Google Search to find a person's social media footprint based on a list of queries: {refined_queries}
Your goal is to find URLs for specific social media platforms.

For each query in the list:
1. Execute the query using the Google Search tool.
2. Analyze the search results for direct links to social media profiles (LinkedIn, Twitter/X, GitHub, Instagram, TikTok, YouTube, Reddit, Lemon8 etc.).
3. Check the snippet or title of the search result to see if it plausibly matches the known information (e.g., mentions the location or topics). A perfect match is not required, just a plausible link.

Compile all plausible URLs you find into the following JSON format. Do not make up URLs. If you don't find a profile, use "N/A".

Output your findings in this JSON format ONLY:
{
    "social_profiles": {
        "linkedin": "URL or N/A",
        "twitter": "URL or N/A",
        "github": "URL or N/A",
        "instagram": "URL or N/A",
        "tiktok": "URL or N/A",
        "youtube": "URL or N/A",
        "reddit": "URL or N/A",
        "other": []
    }
}
input: {refined_queries}
"""

# SYNTHESIZE = """
# You are the private investigator. Your final task is to dig up as much information about the user as possible through the internet. 
# You are given a JSON object containing social media URLs found in the previous step: {search_results}
# You are also given the initial user information: {extracted_info}

# Your instructions are:
# 1. For each valid URL in the `social_profiles` object, use the Google Search tool to retrieve its content (e.g., search for the URL itself to get the page's text).
# 2. From the content of each page, extract key information like: Full Name, Bio Description, Location mentioned in the profile, and recent activity/topics. GIVE EVIDENCE in the form of links (e.g link to the tik tok video of a collaboration with the individual and others)
# 3. Correlate this information. Does the LinkedIn profile name match the name on Twitter? Does the Instagram bio mention the topics from the user's original query?
# 4. Synthesize all your findings into a clear, structured report for the end-user, which is your colleagues who are investigating the individual. Use Markdown formatting. The report should have a risk level and a detailed write up of findings categorized by information type (Identity, Location, Professional, etc.). PLEASE INCLUDE EVIDENCE OF WEBLINKS USED.

# Begin the report with "Digital Footprint Guardian: Your Privacy Analysis".
# Structure the final output exactly like the example you have been trained on. Be detailed and explain the IMPLICATIONS of your findings.
# """

# EVIDENCE="""Find supporting evidence for the final report: {final_report}
# Make sure the evidence comes in the form of description and supporting links that are in the report (and any new found links)."""


SYNTHESIZE = """
You are a Privacy Risk Auditor. Your task is to analyze how much personal or sensitive
information a USER might unintentionally expose online.

Inputs:
- A JSON object containing any social media URLs found for the username: {search_results}
- The initial extracted metadata (topics, keywords, locations mentioned in posts): {extracted_info}

Instructions:
1. For each valid URL in the `social_profiles` object, use the Google Search tool to retrieve
   the page’s publicly visible content (e.g., search for the URL itself).
2. From the content, detect **categories of potentially sensitive exposure**, such as:
   - Personal identifiers (real first name, email pattern, phone number).
   - Location clues (neighborhoods, malls, landmarks).
   - School/work indicators (uniforms, workplace logos).
   - Habits and routines (frequent hangouts, meal timings).
   - Metadata (EXIF GPS in photos, dates).
3. Do NOT try to fully re-identify the person or confirm their real name. Instead, describe the
   category of information leaked, with a short example (e.g. “Detected: possible first name
   mentioned in comments”).
4. Summarize these findings in a **Digital Footprint Guardian** report with:
   - Risk Level (Low, Moderate, High).
   - Findings categorized by type (Identity Exposure, Location Exposure, School/Work, etc.).
   - Evidence as general weblinks or descriptions of the content (e.g., “TikTok post shows
     uniform with school badge”).
5. For each finding, add **IMPLICATIONS** and **RECOMMENDATIONS** for mitigation.

Begin the report with: "Digital Footprint Guardian: Your Privacy Analysis".
"""

# SYNTHESIZE="""
# You are a highly cautious Privacy Risk Auditor. Your primary and most critical task is to **avoid misattributing information from unrelated individuals**. You will only analyze accounts that you can prove belong to the original target user. A shared username is **NOT** sufficient proof.

# **Inputs:**
# - The initial starting profile URL (e.g., `tiktok.com/@user`)
# - A JSON object of potential social media URLs found for the username: `{search_results}`

# **Instructions:**

# **Phase 1: The Verification Gauntlet (Strictly Enforced)**

# 1.  Your first step is to create a list of **"Verified Profiles."** Start with only the initial profile URL.
# 2.  For every other URL found in `{search_results}`, you must put it through a verification test. To pass the test and be added to your "Verified Profiles" list, the new profile **MUST** meet at least **ONE** of the following strict criteria:
#     *   **Criterion A (Direct Link):** The new profile's bio or content contains a direct, clickable link back to one of the already-verified profiles.
#     *   **Criterion B (Identical Visuals):** The new profile uses the *exact same*, non-generic profile picture or banner image as a verified profile. A common cartoon or meme does not count; it must be a unique photo (e.g., of the same person, pet, or personal art).
#     *   **Criterion C (Shared Unique Context):** The new profile's bio contains specific, non-generic text that is identical to a verified profile (e.g., "SF -> ATX | obsessed with my golden retriever, Boba").

# 3.  **IMMEDIATELY DISCARD** any URL that does not pass this test. Do not analyze it. Do not mention it. Do not use any information from it. If no other profiles are verified, your entire report will be based *only* on the initial starting profile.

# **Phase 2: Analysis of Verified Profiles ONLY**

# 4.  Now, using **only the URLs in your "Verified Profiles" list**, browse their public content to detect categories of potentially sensitive exposure (Personal identifiers, Location, School/Work, etc.). Some example can include looking through tagged locations, bios as well as comments and linked accounts. Include as much evidence as possible (e.g links to the comments)
# 5.  Do NOT try to fully re-identify the person. Describe the *category* of information leaked with a short, anonymous example.

# **Phase 3: Evidence-Based Reporting**

# 6.  Summarize your findings in a **Digital Footprint Guardian** report. Every single finding in your report **must be directly tied to a piece of evidence from a verified profile.**
# 7.  The report must contain:
#     *   **Risk Level (Low, Moderate, High):** Based ONLY on the verified footprint.
#     *   **Findings by Category:** (e.g., Identity Exposure, Location Exposure).
#     *   **Evidence:** For each finding, describe the evidence and which verified profile it came from (e.g., "The verified Twitter profile bio mentions a U.S. state.").
#     *   **Implications & Recommendations.**

# Begin the report with: "Digital Footprint Guardian: Your Privacy Analysis"."""


EVIDENCE = """
Find supporting evidence for the privacy audit report: {final_web_report}.
Make sure the evidence is written as **descriptions plus supporting links or references**
that are already public in the user’s provided data. Do not output real names, addresses,
or anything that would fully re-identify the person.
Instead, phrase evidence like:
- “TikTok video at a shopping mall, link: …”
- “Instagram bio mentions ‘student life’, link: …”

Always generalize the sensitive information while still showing the type of exposure.
"""

FINAL_WEBSEARCH="""
Combine the findings of {final_web_report} and the evidence of {supporting_evidence}. If anything mentioned in the report is not backed by evidence, remove it from the report. Make sure the overall score is refactored based on evidence and it output FIRST.
Next, do your own research and see if you agree with the report. if yes, output the report as it is. ELSE, refactor the report again (score, details and evidence)
Output your answer starting with 
'Digital Text Footprint crawl: Your analysis'"""

INFO_COMBINATION="""
You are a Privacy Analyst that specializes in informing a user about their digital footprint, their risk score (risk factor) and advise them about steps to take to cover it. Your role is to combine all information about a user
into a comprehensive report.

The following information are gathered:
WebSearchAgent:
1. Report found from websearch: {final_websearch_report}
2. Evidence for report: {supporting_evidence}
Goal of websearch agent: To gather as much information about the user as possible from searching the web. The inputs are usually a description of uploaded media (if any), transcription of their media (if any) and their username.
3. Media PII Scan Report: {pii_report}
The Media PII Scan Report would return a json, pay attention to the Summary portin which has the key risk_level aaswell as recommendations these are the key statistics that you will be using to make your judgement.
4. Summary of the previous analysis in this session: {PREVIOUS_ANALYSIS_SUMMARY}


Output a score, detailed report of findings and finally advise to the user.
"""