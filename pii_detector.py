import os
import torch
import json
import warnings
warnings.filterwarnings("ignore")

from gliner import GLiNER
from extractor import UniversalTextExtractor

class CleanPIIDetector:
    def __init__(self, model_name: str = "urchade/gliner_multi_pii-v1"):
        print("🚀 Initializing CleanPIIDetector with PHI support...")

        # Initialize extractor + model
        self.text_extractor = UniversalTextExtractor()
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        try:
            self.model = GLiNER.from_pretrained(model_name)
            if hasattr(self.model, 'to'):
                self.model = self.model.to(self.device)
        except Exception as e:
            print(f"⚠️  Failed to load AI model: {e}")
            self.model = None

        # PII labels (Personal Identifiable Information)
        self.pii_labels = [
            "Patient Name", "Address", "email", "Emergency Name",
            "Primary Doctor", "Doctor", "Physician", 
            "phone number", "mobile number", "date of birth", "credit card",
            "social security number", "ssn", "passport number",
            "driver license", "ip address", "password", 
            "Hospital ID", "Medical Record Number", "Patient ID",
            "Insurance ID", "Policy Number", "Member ID", "Subscriber ID",
            "Provider ID", "NPI Number", "Medical License", "DEA Number",
            "nurse", "medical facility", "medical insurance", "health insurance",
        ]

        # PHI labels (Protected Health Information)
        self.phi_labels = [
            "medical condition", "disease", "diagnosis", "symptom", "disorder",
            "medication", "drug", "prescription", "treatment", "therapy",
            "procedure", "surgery", "operation", "medical test", "lab test",
            "blood pressure", "heart rate", "temperature", "weight", "height",
            "allergy", "dosage", "medical history", "vital signs", "blood group",
            "Age", "gender"
        ]

        print("✅ CleanPIIDetector ready!")
        print(f"📋 PII Labels: {len(self.pii_labels)} types")
        print(f"🏥 PHI Labels: {len(self.phi_labels)} types")

    def extract_pii_from_text(self, text: str, confidence_threshold: float = 0.5):
        """Extract PII from text and return simple JSON format"""
        try:
            if not self.model:
                # Demo mode - return sample PII
                return {
                    "Patient Name": "John Doe",
                    "phone number": "+91-9876543210",
                    "email": "john.doe@example.com"
                }

            entities = self.model.predict_entities(text, self.pii_labels, threshold=confidence_threshold)
            
            simple_pii = {}
            for entity in entities:
                label = entity['label']
                text_value = entity['text']
                
                if label in simple_pii:
                    if isinstance(simple_pii[label], list):
                        simple_pii[label].append(text_value)
                    else:
                        simple_pii[label] = [simple_pii[label], text_value]
                else:
                    simple_pii[label] = text_value
            
            return simple_pii
            
        except Exception as e:
            return {"error": f"PII Detection failed: {str(e)}"}

    def extract_phi_from_text(self, text: str, confidence_threshold: float = 0.5):
        """Extract PHI from text and return simple JSON format"""
        try:
            if not self.model:
                # Demo mode - return sample PHI
                return {
                    "medical condition": "Hypertension",
                    "medication": "Lisinopril 10mg",
                    "Age": "45"
                }

            entities = self.model.predict_entities(text, self.phi_labels, threshold=confidence_threshold)
            
            simple_phi = {}
            for entity in entities:
                label = entity['label']
                text_value = entity['text']
                
                if label in simple_phi:
                    if isinstance(simple_phi[label], list):
                        simple_phi[label].append(text_value)
                    else:
                        simple_phi[label] = [simple_phi[label], text_value]
                else:
                    simple_phi[label] = text_value
            
            return simple_phi
            
        except Exception as e:
            return {"error": f"PHI Detection failed: {str(e)}"}

    def extract_pii_from_file(self, file_path: str, confidence_threshold: float = 0.5):
        """Extract PII from file and return simple JSON format"""
        print(f"📄 Extracting PII from: {os.path.basename(file_path)}")

        # Step 1: Extract text
        text = self.text_extractor.extract_text(file_path)
        if text.startswith("Error:"):
            return {"error": text}

        # Step 2: Run PII detection
        return self.extract_pii_from_text(text, confidence_threshold)

    def extract_phi_from_file(self, file_path: str, confidence_threshold: float = 0.5):
        """Extract PHI and return simple JSON format: 'label': 'value'"""
        print(f"🏥 Extracting PHI from: {os.path.basename(file_path)}")

        # Step 1: Extract text
        text = self.text_extractor.extract_text(file_path)
        if text.startswith("Error:"):
            return {"error": text}

        # Step 2: Run PHI detection
        try:
            if not self.model:
                # Demo mode - return sample PHI
                return {
                    "medical condition": "Hypertension",
                    "medication": "Lisinopril 10mg",
                    "blood pressure": "140/90 mmHg"
                }

            entities = self.model.predict_entities(text, self.phi_labels, threshold=confidence_threshold)

            # Simple format: label -> value(s)
            simple_phi = {}
            for entity in entities:
                label = entity['label']
                text_value = entity['text']

                if label in simple_phi:
                    # If label already exists, make it a list
                    if isinstance(simple_phi[label], list):
                        simple_phi[label].append(text_value)
                    else:
                        # Convert single value to list
                        simple_phi[label] = [simple_phi[label], text_value]
                else:
                    # First occurrence of this label
                    simple_phi[label] = text_value

            print(f"✅ PHI Detection complete: {len(simple_phi)} types found")
            return simple_phi

        except Exception as e:
            return {"error": f"PHI Detection failed: {str(e)}"}

    def get_json_string(self, result):
        """Return simple JSON string"""
        return json.dumps(result, indent=2, ensure_ascii=False)

# Convenience functions for easy usage
def extract_pii_simple(file_path: str, confidence: float = 0.5):
    """Quick PII extraction"""
    detector = CleanPIIDetector()
    return detector.extract_pii_from_file(file_path, confidence)

def extract_phi_simple(file_path: str, confidence: float = 0.5):
    """Quick PHI extraction"""
    detector = CleanPIIDetector()
    return detector.extract_phi_from_file(file_path, confidence)

# === Example Usage ===
if __name__ == "__main__":
    print("=== CLEAN PII/PHI DETECTOR ===")

    # Configuration
    FILE_TO_PROCESS = "sample.pdf"
    CONFIDENCE = 0.3

    detector = CleanPIIDetector()

    print(f"\n🎯 Processing file: {FILE_TO_PROCESS}")
    print(f"🔧 Confidence threshold: {CONFIDENCE}")

    # Extract PII
    print(f"\n{'='*50}")
    print("📄 PII DETECTION (Personal Information)")
    print(f"{'='*50}")

    pii_result = detector.extract_pii_from_file(FILE_TO_PROCESS, CONFIDENCE)
    print("\n📄 PII JSON Output:")
    print(detector.get_json_string(pii_result))

    # Extract PHI
    print(f"\n{'='*50}")
    print("🏥 PHI DETECTION (Medical Information)")
    print(f"{'='*50}")

    phi_result = detector.extract_phi_from_file(FILE_TO_PROCESS, CONFIDENCE)
    print("\n🏥 PHI JSON Output:")
    print(detector.get_json_string(phi_result))

    # Summary
    print(f"\n{'='*50}")
    print("📊 SUMMARY")
    print(f"{'='*50}")

    pii_count = len(pii_result) if not pii_result.get("error") else 0
    phi_count = len(phi_result) if not phi_result.get("error") else 0

    print(f"PII Items Found: {pii_count}")
    print(f"PHI Items Found: {phi_count}")
    print(f"Total Sensitive Items: {pii_count + phi_count}")