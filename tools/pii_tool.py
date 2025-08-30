
from tools.pii_detection2 import PIIDetectionAgent 
import logging
from pathlib import Path

logger = logging.getLogger(__name__)


logger.info("Initializing PII Detection Agent as a tool...")
pii_agent = PIIDetectionAgent()
logger.info("PII Detection Agent tool ready.")


def run_pii_analysis(media_path: str) -> dict:
    """
    Analyzes a local image or video file for Personally Identifiable Information (PII).
    
    Args:
        media_path: The local path to the image or video file to be analyzed.
        
    Returns:
        A JSON object containing the PII analysis report.
    """
    logger.info(f"PII tool called for media path: {media_path}")
    
    # Check if the file is an image or video based on extension
    image_extensions = ['.jpg', '.jpeg', '.png']
    video_extensions = ['.mp4', '.mov', '.avi']
    
    file_extension = Path(media_path).suffix.lower()

    try:
        if file_extension in image_extensions:
            # Load image with OpenCV for the analyze_image method
            import cv2
            image = cv2.imread(media_path)
            if image is None:
                raise FileNotFoundError(f"Could not read image file: {media_path}")
            return pii_agent.analyze_image(image, scans_per_second=1)
        elif file_extension in video_extensions:
            return pii_agent.analyze_video(media_path)
        else:
            return {"error": f"Unsupported file type: {file_extension}"}
    except Exception as e:
        logger.error(f"Error during PII analysis tool execution: {e}")
        return {"error": str(e)}