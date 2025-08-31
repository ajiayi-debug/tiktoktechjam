# Using AI for Privacy: Informing users of their liabilities using AI

Watch our solution come to life [here!](https://youtu.be/IzMlzDHbbfo)

## Problem Statement
As generative AI becomes increasingly embedded in daily life, risks of privacy loss grow. Malicious actors exploit AI to harvest personal data, create deepfakes, or mount identity-based attacks, while ordinary AI use can also expose sensitive information through prompts, uploads, or digital traces. To safeguard users, there is a pressing need to leverage AI itself as a protective layer—detecting, preventing, and mitigating privacy breaches. This includes building tools that automatically identify and redact personal identifiers, monitor for potential data leakage, and defend against misuse of online content, enabling safer digital participation in an AI-driven world.

## Solution 
We propose an AI-powered privacy red-teaming tool that helps users understand the hidden risks in the media they share online. When a user uploads a photo, video, or description, the system automatically extracts signals such as audio, text, and visual cues. It then simulates how an adversary might exploit this information: searching the web, linking content to social media profiles, and surfacing sensitive details (e.g., location, identity, affiliations).

Instead of directly harvesting or leaking information, our solution acts as a privacy mirror: it shows users what others could potentially infer about them from their content. By revealing these risks proactively, users are empowered to take preventive steps (e.g., blurring faces, removing location tags, editing captions) before posting.

This approach transforms generative AI from a threat into a safeguard — using the same power that enables privacy attacks to instead defend and educate users about their digital footprint.

## Steps to Run 

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

## Architecture
<img width="933" height="599" alt="Screenshot 2025-08-30 at 12 36 42 PM" src="https://github.com/user-attachments/assets/0c6099b2-b302-491a-949d-2261f9be0968" />
