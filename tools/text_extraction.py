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

class ExtractionText:
    def __init__(self, username: str, video_path: str, description_path: str,
                 out_prefix: str = "output1", audio_filename: str = "output1.wav",
                 overwrite: bool = False):
        self.username = username
        self.video_path = Path(video_path)
        self.description_path = Path(description_path)
        self.out_prefix = out_prefix
        self.audio_path = Path("media") / audio_filename
        self.transcript_txt = Path("description") / f"{out_prefix}.txt"
        self.overwrite = overwrite

        Path("media").mkdir(parents=True, exist_ok=True)
        Path("description").mkdir(parents=True, exist_ok=True)

        if not self.video_path.exists():
            raise FileNotFoundError(self.video_path)
        if not self.description_path.exists():
            raise FileNotFoundError(self.description_path)

        self.audio = AudioExtractor()
        self.stt = SpeechToText()
        self.ti = TextInput()

    def run(self) -> dict:
        # extract
        if self.overwrite or not self.audio_path.exists():
            self.audio.extract_audio(str(self.video_path), str(self.audio_path))
            logging.info("Audio extracted successfully.")

        # transcribe
        if self.overwrite or not self.transcript_txt.exists():
            self.stt.transcribe_audio(str(self.audio_path), self.out_prefix)
            logging.info("Transcription completed successfully.")

        # combine
        combined = self.ti.input_text_prompt(
            self.username, str(self.description_path), str(self.transcript_txt)
        )
        combined_path = self.transcript_txt.parent / f"{self.out_prefix}_combined.txt"
        combined_path.write_text(combined, encoding="utf-8")
        logging.info("Text input prepared successfully.")
        return {
            "audio_path": str(self.audio_path),
            "transcript_path": str(self.transcript_txt),
            "combined_path": str(combined_path),
            "combined_text": combined,
        }

if __name__ == "__main__":
    result = ExtractionText(
        username="kiwiiclaire",
        video_path="media/video1.mp4",
        description_path="description/description1.txt",
        out_prefix="output1",
        audio_filename="output1.wav",
        overwrite=True,
    ).run()