# Using AI for Privacy: Informing users of their liabilities using AI

Watch our solution come to life [here!](https://youtu.be/IzMlzDHbbfo)

## Problem Statement
As generative AI becomes increasingly embedded in daily life, risks of privacy loss grow. Malicious actors exploit AI to harvest personal data, create deepfakes, or mount identity-based attacks, while ordinary AI use can also expose sensitive information through prompts, uploads, or digital traces. To safeguard users, there is a pressing need to leverage AI itself as a protective layer—detecting, preventing, and mitigating privacy breaches. This includes building tools that automatically identify and redact personal identifiers, monitor for potential data leakage, and defend against misuse of online content, enabling safer digital participation in an AI-driven world.

## Solution 
We propose an AI-powered privacy red-teaming tool that helps users understand the hidden risks in the media they share online. When a user uploads a photo, video, or description, the system automatically extracts signals such as audio, text, and visual cues. It then simulates how an adversary might exploit this information: searching the web, linking content to social media profiles, and surfacing sensitive details (e.g., location, identity, affiliations).

Instead of directly harvesting or leaking information, our solution acts as a privacy mirror: it shows users what others could potentially infer about them from their content. By revealing these risks proactively, users are empowered to take preventive steps (e.g., blurring faces, removing location tags, editing captions) before posting.

This approach transforms generative AI from a threat into a safeguard — using the same power that enables privacy attacks to instead defend and educate users about their digital footprint.

## Walkthrough of website
To walk through our website usage, we shall use a real tiktok account @koji.and.yuki (owned by one of our team mates). This is to show the real impact that our agents connecting to the internet have. 
This solution has the assumption that the user is *just* about ready to upload their media (after editing, etc) and agree to the privacy terms when it comes to media upload of social media platforms such as tiktok.

### Frontend Initial Input

**Media uploaded**

![output](https://github.com/user-attachments/assets/55b991e1-7670-4c6d-9bcc-c99c1fad166a)

**Inputs**

<img width="1000" height="781" alt="Screenshot 2025-08-31 at 6 06 35 PM" src="https://github.com/user-attachments/assets/94532631-21a4-4f27-ab32-987ddca6d7dc" />

Insert your tiktok username, description for the media and your media that you will like to upload. Currently, we only support single video and image, but plan to scale to multi video and images in future. When you are ready, press analyze to start the agentic flow.

### Backend agentic flow
<img width="933" height="599" alt="Screenshot 2025-08-30 at 12 36 42 PM" src="https://github.com/user-attachments/assets/0c6099b2-b302-491a-949d-2261f9be0968" />

Note: We initially wanted to mimic social media platform's uploading utilities on Lynx, but due to a lack of time, we reverted to a react based webpage instead. **However**, this diagram shows how our solution can be scaled for usage for many other social media platforms such as tiktok and instagram.

For our agentic flow, we utilised google-adk for agentic workflows. We used a parallel agent to run the three agents, websearch agent, Media PII scan agent and OCR soft Hints agent, in parallel. Then we wrapped this parallel flow together with a summary agent to summarise all agent in a sequential flow agent. We did not utilise a "orchestrator agent" per say as the agent flow will more or less not change and we can fix the agent flow. 

**websearch agent**
Made up of multiple subagents found in [agents/websearch.py](agents/websearch.py), it utilises google_search and url_context tool to search the internet for information that can be found based on the inputed description, username and the transcription of the video (extracted from video to audio to text using gemini)

**Media PII scan agent**
Utilises machine learning techniques in EasyOCR to detect PII data that the user might have unknowingly revealed in the media (video/image) such as location, etc and utilises gemini to summarise the detection (NOTE: PII DATA IS NOT SENT TO GEMINI, ONLY THE DETECTED CLASS AND CONFIDENCE SCORE). This can be found in [agents/media_agent.py](agents/media_agent.py)

**OCR soft hints agent**
Made up of multiple subagents located in [agents/softhints.py](agents/softhints.py), it first detects potential data such as location, etc. Then, it utilises google_search and url_context tool to search for related content to identify (if possible) data about the user (e.g location)

All three agents are utilised as a form of privacy investigators, meant to find dangerous information that can be detected from uploading their media and/or their social media platforms. They act as a red-teamer to try and attack then INFORM the users about their liabilities.

### Frontend Final Output

<img width="987" height="883" alt="Screenshot 2025-08-31 at 6 14 59 PM" src="https://github.com/user-attachments/assets/1697712c-9f4e-4c48-bc53-2db5b751fcd6" />

<img width="1010" height="744" alt="Screenshot 2025-08-31 at 6 14 46 PM" src="https://github.com/user-attachments/assets/c3dfb6d7-05a4-4141-8d52-1d7eb72308ae" />

After the three agents run, we get back a detailed report or summary of the three agent findings as well as the evidence gathered by the agents if any. This serves as a informative reflection to the user using agentic AI and machine learning to not only inform them of their liabilites by uploading the current post, but also liabilities from their existing social media footprint. With this tool, we aim to reduce privacy attacks on users such as doxxing, which is a prevalent issue in the day and age of social media. 

**Sample JSON of report**
```bash
{
  "id": "summary-report-koji-and-yuki",
  "agent": "soft-hints, media pii, web research",
  "summary": "### **Overall Privacy Risk Analysis Report**\n\nThis report synthesizes findings from web research, media PII scanning, and visual soft hint analysis to provide a comprehensive overview of your digital footprint based on the provided content. \n\n**Overall Risk Score: 75/100 (High)**\n\nYour overall risk is assessed as **High**. This is driven primarily by the combination of explicitly naming a specific, sensitive location (**NUS law school**) in your post description, which is visually confirmed by the unique architecture of the building in the video. The mention of this happening 'today' adds a real-time tracking risk. Furthermore, web research uncovered a potential link to a real name and other travel habits, which together could allow a malicious actor to build a detailed and actionable profile of your life, routines, and identity.\n\n--- \n\n### **Detailed Findings & Recommendations**\n\n**1. High-Confidence Location Exposure (High Risk)**\n*   **Finding:** You have publicly disclosed a precise, non-public location in real-time. The post description explicitly states \"NUS law school today! #sg\", and the video contains visual cues, such as the building's unique facade and Singapore-style road markings, that confirm this exact location.\n*   **Evidence:**\n    *   **Textual:** Post description: \"Brought the dogs out to NUS law school today! #sg #fyp\".\n    *   **Visual (OCR/Soft Hints):** The distinct architecture of the NUS Law Building at the Bukit Timah Campus is identifiable in the media. Country-level identifiers like license plate format and road markings corroborate the Singapore location.\n*   **Implications:**\n    *   **Physical Security:** Anyone can now know your location in real-time. This also establishes a potential routine, making it easier to predict your whereabouts in the future.\n    *   **Doxing & Harassment:** This specific location can be used to identify you as a student, faculty member, or staff, significantly narrowing down your identity and making you an easier target for doxing or social engineering (e.g., phishing emails disguised as university communications).\n*   **Actionable Recommendations:**\n    *   **Generalize Locations:** Immediately edit the post to remove the specific location. Instead, use generic terms like \"a university campus\" or simply \"Singapore\".\n    *   **Obscure Backgrounds:** In future posts, use a tighter crop on your subjects (your dogs) or apply a blur to any unique background landmarks that could identify a location.\n    *   **Implement a Posting Delay:** Avoid posting about your location in real-time. Wait hours, or even days, to post content from sensitive locations.\n\n**2. Potential Identity & Real Name Exposure (Moderate Risk)**\n*   **Finding:** Web searches for your username \"koji.and.yuki\" surfaced a prominent TikTok profile for a musician named \"Yuki Kojima\". The shared name components create a strong potential link between your pet-focused account and a public, professional persona.\n*   **Evidence:**\n    *   **Web Research:** A publicly viewable TikTok profile for \"Koji Koji Moheji (YUKI KOJIMA)\" at `https://www.tiktok.com/@kojikojimoheji` was found in connection with your username.\n*   **Implications:**\n    *   **Context Collapse:** This allows strangers to bridge the gap between your personal life (pet ownership) and your potential professional life, potentially exposing you to unwanted attention in either context.\n    *   **Increased Doxing Surface:** A suspected real name is a critical piece of information for anyone trying to find more of your personal data online.\n*   **Actionable Recommendations:**\n    *   **Use Unique Usernames:** To maintain separation between different aspects of your life, consider using completely distinct and non-obvious usernames for personal and public/professional accounts.\n    *   **Audit Naming Conventions:** Avoid using username patterns that are easily traced back to your real name or the names of close family and pets.\n\n**3. Travel & Lifestyle Pattern Exposure (Moderate Risk)**\n*   **Finding:** The media transcript mentions a visit to \"Butchart Gardens,\" a well-known international tourist destination in British Columbia, Canada.\n*   **Evidence:**\n    *   **Web Research/Transcript:** The audio transcript contains the phrase \"Butchart Gardens\", which is a famous location.\n*   **Implications:**\n    *   **Home Security:** Posting about international travel in real-time signals that your home is likely unoccupied, increasing the risk of burglary.\n    *   **Financial Profiling:** Details about international travel can be used to build a profile of your financial status.\n*   **Actionable Recommendations:**\n    *   **Post-Travel Sharing:** Make it a rule to only share photos and details from trips after you have returned home.\n\n**4. Unintentional PII in Media (Low Risk)**\n*   **Finding:** The automated PII scan detected low-confidence instances of potential \"Street Name/Address\" information within the audio transcript.\n*   **Evidence:**\n    *   **Media PII Scan:** Detected fragments like \"Seems like they had a\" and \"Koji is a\" as potential address information (confidence: 0.4).\n*   **Implications:** While these specific findings are likely false positives, they demonstrate that automated tools can misinterpret speech and potentially flag sensitive information. It highlights the general risk of background conversations or unintentional speech being captured in videos.\n*   **Actionable Recommendations:**\n    *   **Review Audio:** Always review the audio of your videos to ensure no sensitive background conversations or accidental mentions of personal data are included before posting.",
  "risk": 75,
  "artifacts": [
    {
      "label": "User TikTok Profile",
      "url": "https://www.tiktok.com/@koji.and.yuki"
    },
    {
      "label": "Potentially Linked Identity (Yuki Kojima)",
      "url": "https://www.tiktok.com/@kojikojimoheji"
    },
    {
      "label": "Detected Visual Cue: NUS Law Building Facade",
      "url": "https://law.nus.edu.sg/about-us/bukit-timah-campus/"
    },
    {
      "label": "Detected Soft Hint: Singapore license plate format",
      "summary": "Visual confirmation of country location, already disclosed with #sg hashtag."
    },
    {
      "label": "Detected PII Type (Media Scan)",
      "summary": "address_street_name_forgiving (Low Confidence)"
    }
  ],
  "status": "done"
}
```


## Steps to Run 

## Set up environment variables
Insert `.env` into root with the following parameters:
```bash
GOOGLE_API_KEY=[Insert your gemini api key obtained from google ai studio]
```

### 🚀 How to Run

### 1. Backend (FastAPI)

You need **Python 3.12** or [`uv`](https://github.com/astral-sh/uv).

**Option A – using `uv` (recommended):**
```bash
# install dependencies
uv sync

# start backend
uv run fastapi dev receive_media.py
```

**Option B – using plain Python/pip:**
```bash
# create & activate virtual environment
python3.12 -m venv .venv
source .venv/bin/activate   # on Windows: .venv\Scripts\activate

# install dependencies
pip install -r requirements.txt

# start backend
fastapi dev receive_media.py
```

This runs the API server at **http://localhost:8000**.

---

### 2. Frontend (React + Vite)

```bash
cd privacy-guard
npm install
npm run dev
```

This runs the frontend at **http://localhost:5173** (by default).

---

### ✅ You’re all set

- Backend → http://localhost:8000  
- Frontend → http://localhost:5173  

Open the frontend in your browser — it will connect to the FastAPI backend automatically.


