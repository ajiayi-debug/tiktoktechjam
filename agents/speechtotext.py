from google import genai
import os
from dotenv import load_dotenv
import certifi
load_dotenv()
os.environ['SSL_CERT_FILE'] = certifi.where()
client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

output="output1"
myfile = client.files.upload(file=f'media/{output}.wav')
prompt = 'Generate a transcript of the speech.'

response = client.models.generate_content(
  model='gemini-2.5-flash',
  contents=[prompt, myfile]
)

# Save to .txt
with open(f"description/{output}.txt", "w", encoding="utf-8") as f:
    f.write(response.text)

print(f"✅ Saved to description/{output}.txt")