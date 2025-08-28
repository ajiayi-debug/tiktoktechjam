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
    A streamlined on-device solution for detecting textual PII in images
    using the EasyOCR model.
    """

    def __init__(self):
        """Initializes the agent with the EasyOCR model."""
        self._initialize_pii_patterns()
        
        logger.info("Loading EasyOCR model (this may download on first run)...")
        # Initialize EasyOCR. It will use the CPU by default if no GPU is found.
        self.ocr_reader = easyocr.Reader(['en'])
        logger.info("EasyOCR model loaded successfully.")

    def _initialize_pii_patterns(self):
        """Initializes regex patterns for various PII types."""
        self.pii_patterns = {
            'singapore_nric': {'pattern': r'\b[STFG]\d{7}[A-Z]\b', 'description': 'Singapore NRIC', 'risk': 'high'},
            'singapore_phone': {'pattern': r'(?:\+65\s?)?[89]\d{3}\s?\d{4}\b', 'description': 'Singapore phone number', 'risk': 'medium'},
            'singapore_address': {'pattern': r'\b(?:[Bb8][Ll1][Kk]|[Bb8][Ll1][0oO][Cc][Kk])?\s*\d+[A-Z]?\s+[\w\s]+(?:Road|Street|Avenue|Drive|Place|Lane)\s*(?:#\d+-\d+)?\s*Singapore\s*\d{6}\b', 'description': 'Singapore address', 'risk': 'high'},
            'singapore_postal': {'pattern': r'\bSingapore\s*\d{6}\b', 'description': 'Singapore postal code', 'risk': 'medium'},
            'email': {'pattern': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', 'description': 'Email address', 'risk': 'medium'},
            'credit_card': {'pattern': r'\b(?:\d{4}[\s-]?){3}\d{4}\b', 'description': 'Credit card number', 'risk': 'high'},
            'social_media': {'pattern': r'@[A-Za-z0-9_]+', 'description': 'Social media handle', 'risk': 'low'},
            'ip_address': {'pattern': r'\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b', 'description': 'IP address', 'risk': 'medium'}
        }

    def detect_textual_pii(self, image: np.ndarray) -> List[Dict[str, Any]]:
        """Extracts text from an image using EasyOCR."""
        findings = []
        try:
            logger.info("Extracting text from image with EasyOCR...")
            
            # EasyOCR is generally robust with BGR images from OpenCV, but converting to RGB is best practice.
            image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            
            # Use paragraph=True to group text, detail=0 to get only the text strings.
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
            
    def analyze_image(self, image_path: str) -> Dict[str, Any]:
        """Main method to analyze an image for PII."""
        logger.info(f"Analyzing image: {image_path}")
        
        path = Path(image_path)
        if not path.exists():
            raise FileNotFoundError(f"Image not found: {image_path}")
            
        image = cv2.imread(str(path))
        if image is None:
            raise ValueError(f"Failed to load image: {image_path}")

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
        
        result = asdict(report)
        result['image_path'] = str(path.absolute())
        
        logger.info(f"Analysis complete. Risk level: {risk_level}")
        return result
        
    def _generate_recommendations(self, textual_pii: List) -> List[str]:
        """Generates privacy recommendations based on findings."""
        recommendations = []
        
        if any(pii['type'] == 'singapore_nric' for pii in textual_pii):
            recommendations.append("CRITICAL: NRIC number detected - remove immediately")
        if any(pii['type'] in ['email', 'singapore_phone'] for pii in textual_pii):
            recommendations.append("Contact information visible - consider removing")
        if any(pii['type'] == 'singapore_address' for pii in textual_pii):
            recommendations.append("Address information detected - high doxxing risk")
            
        if not recommendations:
            recommendations.append("No significant PII detected - image appears safe to share")
            
        return recommendations