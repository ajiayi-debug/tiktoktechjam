import os
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




    def _initialize_pii_patterns(self):
        """Initializes patterns with confidence scores."""
        self.pii_patterns = {
            'singapore_nric': {
                'pattern': r'\b[STFG56][0-9OIl]{7}[A-Z]\b', 
                'description': 'Singapore NRIC', 'risk': 'high', 'confidence': 0.95
            },
            'credit_card': {
                'pattern': r'\b(?:[0-9OIl]{4}[\s-]?){3}[0-9OIl]{4}\b', 
                'description': 'Credit card number', 'risk': 'high', 'confidence': 0.95
            },
            'address_unit_no': {
                'pattern': r'#?\s*\d{1,3}\s*-\s*\d{1,4}[A-Za-z]?\b',
                'description': 'Address Unit Number', 'risk': 'high', 'confidence': 0.85
            },
            'singapore_phone': {
                'pattern': r'(?:\+?65[\s-]?)?[8B9][0-9OIl]{3}[\s-]?[0-9OIl]{4}\b', 
                'description': 'Singapore phone number', 'risk': 'medium', 'confidence': 0.75
            },
            'email': {
                'pattern': r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', 
                'description': 'Email address', 'risk': 'medium', 'confidence': 0.9
            },
            'address_postal_code': {
                'pattern': r'\b[5S]?\w?[nN9]\s*[gG]\s*[aA]\s*[pP]\w{0,3}\s*\d{6}\b',
                'description': 'Postal Code (e.g., Singapore 123456)', 'risk': 'medium', 'confidence': 0.6
            },
            'address_street_name_forgiving': {
                'pattern': r"\b(?:\d{1,4}\s+)?[A-Za-z\s']+\s+(?:R(oa)?d|S(tr?ee)?t|A(ve?n?ue)?|Dr(ive)?|L(ane|n)?|B(ou)?lev?ard|Blvd|Cres(cent)?)\b",
                'description': 'Street Name/Address', 'risk': 'medium', 'confidence': 0.4
            },
            'address_blk_no': {
                'pattern': r'\b(?:B(lock|lk|1k)|8lk)\s*\d+[A-Za-z]?\b',
                'description': 'Block Number Fragment', 'risk': 'low', 'confidence': 0.5
            },
            'social_media': {
                'pattern': r'@[A-Za-z0-9_]+', 
                'description': 'Social media handle', 'risk': 'low', 'confidence': 0.6
            },
            'address_keyword_tower': {
                'pattern': r'\b(T(owe|wne|oue)r)\b',
                'description': 'Address Keyword: "Tower"', 'risk': 'low', 'confidence': 0.3
            },
            'address_keyword_floor': {
                'pattern': r'\b(F(loo|lour|1oor)r)\b',
                'description': 'Address Keyword: "Floor"', 'risk': 'low', 'confidence': 0.3
            }
        }





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
                            'type': pii_type, 
                            'value': match.group(), 
                            'description': config['description'],
                            'risk_level': config['risk'], 
                            'location': None, 
                            'confidence': config['confidence'] 
                                }
                    findings.append(finding)
                    logger.info(f"Found {config['description']}: {match.group()}")

        except Exception as e:
            logger.error(f"Text extraction/PII detection failed: {e}")
            
        return findings







    def _calculate_risk_level(self, textual_pii_findings: List, low_risk_threshold: int = 3) -> str:
        """
        Calculates overall risk. Elevates risk to 'medium' if multiple 'low'
        risk items are found.
        """
        
        risk_levels_found = {pii['risk_level'] for pii in textual_pii_findings}

        if 'high' in risk_levels_found:
            return 'high'
        if 'medium' in risk_levels_found:
            return 'medium'
        
        low_risk_count = sum(1 for pii in textual_pii_findings if pii['risk_level'] == 'low')
        if low_risk_count >= low_risk_threshold:
            return 'medium' 
        elif low_risk_count > 0:
            return 'low'

        return 'none'
                
            
            
            
            
            
            
    def analyze_image(self, image: np.ndarray) -> Dict[str, Any]:
        """Analyzes a single image frame for PII."""
        
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
        
        return asdict(report)
        
    
    
    
    
    def analyze_video(self, video_path: str, scans_per_second: int = 1) -> Dict[str, Any]:
        """
        Analyzes a video for PII by intelligently sampling frames .

        Args:
            video_path: Path to the video file.
            scans_per_second: How many frames to analyze per second of video (As not efficient to analyze every single frame
            so for tradeoff sake we will take scans_per_sceond as input to allow variability).

        Returns:
            A list of PII reports for each frame that contained PII.
        """
        logger.info(f"Analyzing video for consolidated report: {video_path}")
    
        path = Path(video_path)
        if not path.exists():
            raise FileNotFoundError(f"Video not found: {video_path}")

        cap = cv2.VideoCapture(str(path))
        if not cap.isOpened():
            raise IOError(f"Could not open video file: {video_path}")

        video_fps = cap.get(cv2.CAP_PROP_FPS)
        video_fps = 30 if video_fps == 0 else video_fps
        frame_interval = int(video_fps / scans_per_second)
        logger.info(f"Video FPS: {video_fps:.2f}, analyzing every {frame_interval} frames.")
        
        all_findings_raw = []
        frame_count = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % frame_interval == 0:
                timestamp_ms = cap.get(cv2.CAP_PROP_POS_MSEC)
                logger.info(f"Analyzing frame {frame_count} at timestamp {timestamp_ms/1000:.2f}s...")
                
                frame_findings = self.detect_textual_pii(frame)
                
                for finding in frame_findings:
                    finding['timestamp_seconds'] = round(timestamp_ms / 1000, 2)
                    finding['frame_number'] = frame_count
                    all_findings_raw.append(finding)

            frame_count += 1
            
        cap.release()

        unique_findings = []
        seen = set()
        for finding in all_findings_raw:
            finding_key = (finding['type'], finding['value'])
            if finding_key not in seen:
                unique_findings.append(finding)
                seen.add(finding_key)
        

        risk_order = {'high': 2, 'medium': 1, 'low': 0, 'none': -1}

        #Sort all unique findings by their risk level in descending order
        sorted_findings = sorted(
            unique_findings, 
            key=lambda f: risk_order.get(f['risk_level'], -1), 
            reverse=True
        )

        #Take only the top 3 highest-risk findings
        top_3_findings = sorted_findings[:3]
        
        logger.info(f"Consolidated report to top {len(top_3_findings)} highest-risk findings.")

        #Generate the final summary based on the top 3 findings
        final_risk_level = self._calculate_risk_level(top_3_findings)
        final_summary = {
            'total_unique_findings_in_video': len(unique_findings),
            'showing_top_findings': len(top_3_findings),
            'risk_level': final_risk_level,
            'recommendations': self._generate_recommendations(top_3_findings)
        }
        
        final_report = PIIReport(
            textual_pii_findings=top_3_findings, 
            summary=final_summary,
            risk_level=final_risk_level
        )
        
        return asdict(final_report)
        
        
        
        
        
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