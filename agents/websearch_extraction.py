from google import genai
import os
from dotenv import load_dotenv
import certifi
import subprocess
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

    def extract_audio(self, video_file, audio_file):
        cmd = [
            "ffmpeg",
            "-i", video_file,
            "-q:a", "0",
            "-map", "a",
            audio_file
        ]
        subprocess.run(cmd, check=True)


if __name__ == "__main__":
    video_file_path = "media/video1.mp4"
    audio_file_path = "media/output1.wav"
    output = "output1"
    ae=AudioExtractor()
    ae.extract_audio(video_file_path, audio_file_path)
    stt = SpeechToText()
    stt.transcribe_audio(audio_file_path, output)
