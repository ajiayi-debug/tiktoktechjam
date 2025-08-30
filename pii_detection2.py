<<<<<<< HEAD
import os
=======
>>>>>>> 70abc5de120bec3abc522c49104c5a520604d26d
import json
import re
import sys
import logging
from pathlib import Path
from typing import Dict, List, Any
from dataclasses import dataclass, asdict
import warnings

import cv2
import numpy as np
import easyocr

warnings.filterwarnings("ignore")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('Sentinel')


@dataclass
class PIIReport:
    """Structured report for all PII findings"""
    textual_pii_findings: List[Dict[str, Any]]
    summary: Dict[str, Any]
    risk_level: str


class PIIDetectionAgent:
    """
    A robust on-device solution for detecting textual PII in images
    using EasyOCR and flexible regex.
    """

    def __init__(self):
        """Initializes the agent with the EasyOCR model."""
        self._initialize_pii_patterns()
        
        logger.info("Loading EasyOCR model (this may download on first run)...")
        self.ocr_reader = easyocr.Reader(['en'])
        logger.info("EasyOCR model loaded successfully.")

<<<<<<< HEAD



=======
>>>>>>> 70abc5de120bec3abc522c49104c5a520604d26d
    def _initialize_pii_patterns(self):
        """Initializes comprehensive, OCR-forgiving regex patterns."""
        self.pii_patterns = {
            'singapore_nric': {
                'pattern': r'\b[5STFG6][0-9OIl]{7}[A-Z]\b', 
                'description': 'Singapore NRIC', 'risk': 'high'
            },
            'singapore_phone': {
                'pattern': r'(?:\+?65[\s-]?)?[8B9][0-9]{3}[\s-]?[0-9]{4}\b', 
                'description': 'Singapore phone number', 'risk': 'medium'
            },
            'email': {
                'pattern': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', 
                'description': 'Email address', 'risk': 'medium'
            },
            'credit_card': {
                'pattern': r'\b(?:[0-9OIl]{4}[\s-]?){3}[0-9OIl]{4}\b', 
                'description': 'Credit card number', 'risk': 'high'
            },
            'address_postal_standalone': {
                'pattern': r'\b\d{3}\s?\d{3}\b',
                'description': 'Standalone Postal Code', 'risk': 'medium'
            },
            'address_street_name': {
                'pattern': r'\b\d{0,4}\s?[A-Za-z\s,]+(?:Avenue|Ave|Road|Rd|Street|St|Drive|Dr|Lane|Ln|Crescent|Cres)\b',
                'description': 'Street Name/Address Fragment', 'risk': 'medium'
            },
            'address_blk_no': {
                'pattern': r'\b(?:Block|Blk|B1k|81k)\s*\d+[A-Za-z]?\b',
                'description': 'Block Number Fragment', 'risk': 'low'
            },
            'social_media': {
                'pattern': r'@[A-Za-z0-9_]+', 
                'description': 'Social media handle', 'risk': 'low'
            },
            'ip_address': {
                'pattern': r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b', 
                'description': 'IP address', 'risk': 'medium'
            }
        }

<<<<<<< HEAD






=======
>>>>>>> 70abc5de120bec3abc522c49104c5a520604d26d
    def detect_textual_pii(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """Extracts text from an image using EasyOCR."""
        findings = []
        try:
            logger.info("Extracting text from image with EasyOCR...")
            
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            ocr_results = self.ocr_reader.readtext(image_rgb, detail=0, paragraph=True)
            full_text = ' '.join(ocr_results)
            
            print(f"\n--- OCR TEXT FOR DEBUGGING ---\n{full_text}\n--- END OF OCR TEXT ---\n")
            
            logger.info(f"Extracted {len(full_text)} characters of text")
            
            for pii_type, config in self.pii_patterns.items():
                pattern = re.compile(config['pattern'], re.IGNORECASE)
                matches = pattern.finditer(full_text)
                
                for match in matches:
                    finding = {
                        'type': pii_type, 'value': match.group(), 'description': config['description'],
                        'risk_level': config['risk'], 'location': None, 'confidence': 0.9
                    }
                    findings.append(finding)
                    logger.info(f"Found {config['description']}: {match.group()}")

        except Exception as e:
            logger.error(f"Text extraction/PII detection failed: {e}")
            
        return findings

<<<<<<< HEAD






=======
>>>>>>> 70abc5de120bec3abc522c49104c5a520604d26d
    def _calculate_risk_level(self, textual_pii_findings: List) -> str:
        """Calculates the overall risk level based on findings."""
        high_risk_count = 0
        medium_risk_count = 0
        
        for pii in textual_pii_findings:
            if pii['risk_level'] == 'high': high_risk_count += 1
            elif pii['risk_level'] == 'medium': medium_risk_count += 1
                
        if high_risk_count > 0: return 'high'
        if medium_risk_count > 1: return 'medium'
        return 'low'
            
<<<<<<< HEAD
            
            
            
            
            
            
    def analyze_image(self, image: np.ndarray) -> Dict[str, Any]:
        """Analyzes a single image frame for PII."""
        
=======
    def analyze_image(self, image_path: str) -> Dict[str, Any]:
        """Main method to analyze an image for PII."""
        logger.info(f"Analyzing image: {image_path}")
        
        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"Image not found: {image_path}")
            
        image = cv2.imread(str(path))
        if image is None:
            raise ValueError(f"Failed to load image: {image_path}")

>>>>>>> 70abc5de120bec3abc522c49104c5a520604d26d
        textual_pii_findings = self.detect_textual_pii(image)
        risk_level = self._calculate_risk_level(textual_pii_findings)
        
        summary = {
            'total_findings': len(textual_pii_findings),
            'textual_pii_detected': len(textual_pii_findings),
            'risk_level': risk_level,
            'recommendations': self._generate_recommendations(textual_pii_findings)
        }
        
        report = PIIReport(
            textual_pii_findings=textual_pii_findings,
            summary=summary,
            risk_level=risk_level
        )
        
<<<<<<< HEAD
        return asdict(report)
        
    
    
    
    
    def analyze_video(self, video_path: str, scans_per_second: int = 1) -> List[Dict[str, Any]]:
        """
        Analyzes a video for PII by intelligently sampling frames .

        Args:
            video_path: Path to the video file.
            scans_per_second: How many frames to analyze per second of video (As not efficient to analyze every single frame
            so for tradeoff sake we will take scans_per_sceond as input to allow variability).

        Returns:
            A list of PII reports for each frame that contained PII.
        """
        
        
        logger.info(f"Analyzing video: {video_path} at {scans_per_second} scans/sec")
        
        path = Path(video_path)
        if not path.exists():
            raise FileNotFoundError(f"Video not found: {video_path}")

        cap = cv2.VideoCapture(str(path))
        if not cap.isOpened():
            raise IOError(f"Could not open video file: {video_path}")

        video_fps = cap.get(cv2.CAP_PROP_FPS)
        if video_fps == 0:
            logger.warning("Could not determine video FPS. Defaulting to 30.")
            video_fps = 30 # Set a default if FPS is not available

        frame_interval = int(video_fps / scans_per_second)
        logger.info(f"Video FPS: {video_fps:.2f}, analyzing every {frame_interval} frames.")
        
        frame_count = 0
        all_findings = []

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break # End of video

            # The core sampling logic
            if frame_count % frame_interval == 0:
                timestamp_ms = cap.get(cv2.CAP_PROP_POS_MSEC)
                logger.info(f"Analyzing frame {frame_count} at timestamp {timestamp_ms/1000:.2f}s...")
                
                report = self.analyze_image(frame)
                
                # Only store reports where PII was actually found
                if report['summary']['total_findings'] > 0:
                    report['frame_number'] = frame_count
                    report['timestamp_seconds'] = round(timestamp_ms / 1000, 2)
                    all_findings.append(report)

            frame_count += 1
            
        cap.release()
        logger.info(f"Video analysis complete. Found PII in {len(all_findings)} sampled frames.")
        return all_findings
        
        
        
=======
        result = asdict(report)
        result['image_path'] = str(path.absolute())
        
        logger.info(f"Analysis complete. Risk level: {risk_level}")
        return result
>>>>>>> 70abc5de120bec3abc522c49104c5a520604d26d
        
    def _generate_recommendations(self, textual_pii: List) -> List[str]:
        """Generates privacy recommendations based on findings."""
        recommendations = []
        
        if any(pii['type'] == 'singapore_nric' for pii in textual_pii):
            recommendations.append("CRITICAL: NRIC number detected - remove immediately")
        if any(pii['type'] in ['email', 'singapore_phone'] for pii in textual_pii):
            recommendations.append("Contact information visible - consider removing")
        if any(pii['type'].startswith('address_') for pii in textual_pii):
            recommendations.append("Address information detected - high doxxing risk")
            
        if not recommendations:
            recommendations.append("No significant PII detected - image appears safe to share")
            
        return recommendations