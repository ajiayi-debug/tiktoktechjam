from google import genai
import os
from dotenv import load_dotenv
import certifi
import subprocess
import logging
from pathlib import Path
logging.basicConfig(level=logging.INFO)
load_dotenv()

class SpeechToText:
    """Transcribe from audio files."""
    def __init__(self):
        os.environ['SSL_CERT_FILE'] = certifi.where()
        self.client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY"))

    def transcribe_audio(self, audio_file_path, output):
        myfile = self.client.files.upload(file=audio_file_path)
        prompt = 'Generate a transcript of the speech.'

        response = self.client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt, myfile]
        )

        # Save to .txt
        with open(f"description/{output}.txt", "w", encoding="utf-8") as f:
            f.write(response.text)

        print(f" Saved to description/{output}.txt")

class AudioExtractor:
    """Extract audio from video files."""
    def __init__(self):
        pass

    def extract_audio(self, video_file: str, audio_file: str):
        # Ensure output folder exists
        Path(audio_file).parent.mkdir(parents=True, exist_ok=True)

        cmd = [
            "ffmpeg",
            "-y",                 
            "-i", video_file,
            "-vn",                
            "-ac", "1",          
            "-ar", "16000",       
            "-map", "0:a:0",     
            "-f", "wav",          
            "-acodec", "pcm_s16le",  
            audio_file
        ]
        subprocess.run(cmd, check=True)


class TextInput:
    """Combine all text input into a single string."""
    def __init__(self):
        self.text = ""

    def input_text_prompt(self,username,description,transcript):
        # description="description/description1.txt"
        # transcript="description/output1.txt"

        with open(description, "r", encoding="utf-8") as f:
            description_content = f.read()

        with open(transcript, "r", encoding="utf-8") as f:
            transcript_content = f.read()

        self.text = f"Tik Tok username: {username}, media description: {description_content}, transcript: {transcript_content}"
        return self.text

if __name__ == "__main__":
    video_file_path = "media/video1.mp4"
    audio_file_path = "media/output1.wav"
    output = "output1"
    ae=AudioExtractor()
    ae.extract_audio(video_file_path, audio_file_path)
    logging.info("Audio extracted successfully.")
    stt = SpeechToText()
    stt.transcribe_audio(audio_file_path, output)
    logging.info("Transcription completed successfully.")
    ti=TextInput()
    ti.input_text_prompt("kiwiiclaire", "description/description1.txt", "description/output1.txt")
    logging.info("Text input prepared successfully.")
