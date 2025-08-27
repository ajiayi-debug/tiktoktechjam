import subprocess

def extract_audio(video_file, audio_file):
    cmd = [
        "ffmpeg",
        "-i", video_file,
        "-q:a", "0",
        "-map", "a",
        audio_file
    ]
    subprocess.run(cmd, check=True)

# Example
extract_audio("media/video1.mp4", "media/output1.wav")