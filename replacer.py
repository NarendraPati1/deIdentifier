import json
import re
import random
from typing import Dict, List, Union
from datetime import datetime
from faker import Faker
from pii_detector import CleanPIIDetector

class SimplePIIFaker:
    """
    Complete PII Faker that generates realistic Indian fake data.
    Replaces PII with synthetic values while keeping PHI intact.
    """

    def __init__(self, locale: str = 'en_IN'):
        # Initialize with Indian locale for authentic data
        self.faker = Faker(locale)
        self.replacement_cache = {}
        self.current_patient_name = None

    def _generate_aadhaar(self) -> str:
        """Generate Aadhaar-like 12-digit number"""
        return ''.join(str(random.randint(0, 9)) for _ in range(12))

    def _clean_for_email(self, name_part: str) -> str:
        """Clean name parts for email generation"""
        return re.sub(r'[^a-z]', '', name_part.lower())

    def generate_fake_value(self, label: str, original_value: str) -> str:
        """Generate fake value based on PII label using Indian data"""

        # Check cache for consistency
        cache_key = f"{label}:{original_value}"
        if cache_key in self.replacement_cache:
            return self.replacement_cache[cache_key]

        label_lower = label.lower()
        fake_value = ""

        # PERSONAL NAMES & DOCTOR HANDLING
        if 'patient name' in label_lower or 'name' in label_lower:
            if any(title in original_value.lower() for title in ['mr.', 'mr', 'shri', 'sri']):
                fake_value = self.faker.name_male()
            elif any(title in original_value.lower() for title in ['mrs.', 'ms.', 'miss', 'smt', 'dr.']):
                if 'dr.' in original_value.lower():
                    fake_value = f"Dr. {self.faker.name()}"
                else:
                    fake_value = self.faker.name_female()
            else:
                fake_value = self.faker.name()

            # Store patient name for email generation
            if 'patient name' in label_lower or label_lower == 'name':
                self.current_patient_name = fake_value

        # DOCTOR / PRIMARY DOCTOR
        elif 'doctor' in label_lower or 'primary doctor' in label_lower or 'physician' in label_lower:
            specialties = ['Cardiologist', 'Neurologist', 'Orthopedist', 'Dermatologist', 'Pediatrician']
            name = self.faker.name()
            specialty = random.choice(specialties)
            fake_value = f"Dr. {name}, {specialty}"

        # EMAIL GENERATION - Use patient name for consistency
        elif 'email' in label_lower:
            if self.current_patient_name:
                name_parts = self.current_patient_name.lower().replace('dr. ', '').split()
                if len(name_parts) >= 2:
                    first_name = self._clean_for_email(name_parts[0])
                    last_name = self._clean_for_email(name_parts[-1])
                    domain_options = ['example.com', 'example.org', 'test.com', 'sample.org', 'demo.net']
                    domain = random.choice(domain_options)
                    fake_value = f"{first_name}.{last_name}@{domain}"
                else:
                    clean_name = self._clean_for_email(name_parts[0])
                    domain = random.choice(['example.com', 'example.org', 'test.com'])
                    fake_value = f"{clean_name}@{domain}"
            else:
                fake_value = self.faker.email()

        # CONTACT INFORMATION
        elif 'phone number' in label_lower or 'mobile number' in label_lower:
            # Generate valid Indian mobile number
            fake_value = "+91-" + str(random.randint(6000000000, 9999999999))

        elif 'address' in label_lower or 'location' in label_lower:
            # Generate Indian address
            fake_value = self.faker.address().replace("\n", ", ")

        # MEDICAL IDENTIFIERS
        elif 'hospital id' in label_lower:
            fake_value = f"HOSP-{random.randint(1000000, 9999999)}"

        elif 'patient id' in label_lower:
            fake_value = f"PAT-{random.randint(100000, 999999)}"

        elif 'medical record number' in label_lower or 'mrn' in label_lower:
            fake_value = f"MRN{random.randint(100000, 9999999)}"

        elif 'insurance id' in label_lower or 'policy number' in label_lower:
            fake_value = f"POL-{random.randint(10000000, 99999999)}"

        elif 'member id' in label_lower or 'subscriber id' in label_lower:
            fake_value = f"MEM-{random.randint(1000000, 9999999)}"

        elif 'provider id' in label_lower:
            fake_value = f"PROV-{self.faker.random_int(min=1000, max=9999)}"

        elif 'npi number' in label_lower:
            fake_value = str(self.faker.random_int(min=1000000000, max=9999999999))

        elif 'medical license' in label_lower or 'license number' in label_lower:
            state_codes = ['MH', 'DL', 'KA', 'TN', 'UP', 'GJ', 'RJ', 'WB', 'AP', 'MP']
            state_code = random.choice(state_codes)
            fake_value = f"{state_code}MED{self.faker.random_int(min=10000, max=99999)}"

        elif 'dea number' in label_lower:
            letters = ''.join(self.faker.random_letters(length=2)).upper()
            numbers = str(self.faker.random_int(min=1000000, max=9999999))
            fake_value = f"{letters}{numbers}"

        # PERSONAL INFORMATION
        elif 'date of birth' in label_lower or 'dob' in label_lower or 'birth' in label_lower:
            fake_date = self.faker.date_of_birth(minimum_age=18, maximum_age=75)
            fake_value = fake_date.strftime('%d %B %Y')

        elif 'credit card' in label_lower:
            fake_value = f"****-****-****-{self.faker.random_int(min=1000, max=9999)}"

        elif 'ssn' in label_lower or 'social security' in label_lower or 'aadhaar' in label_lower:
            fake_value = self._generate_aadhaar()

        elif 'passport' in label_lower:
            fake_value = f"{self.faker.random_letter().upper()}{self.faker.random_int(min=1000000, max=9999999)}"

        elif 'driver license' in label_lower or 'driving licence' in label_lower:
            state_codes = ['DL', 'MH', 'KA', 'TN', 'UP', 'GJ', 'RJ']
            state = random.choice(state_codes)
            fake_value = f"{state}{self.faker.random_int(min=10000000000, max=99999999999)}"

        # INSURANCE INFORMATION
        elif any(word in str(original_value).lower() for word in ['insurance', 'assurance', 'life', 'general', 'health', 'medical']):
            insurance_names = [
                'Apollo Munich Health Insurance',
                'HDFC Life Insurance',
                'Max Life Insurance', 
                'SBI Life Insurance',
                'ICICI Prudential Life Insurance',
                'Bajaj Allianz Life Insurance',
                'LIC of India',
                'Star Health Insurance',
                'New India Assurance'
            ]
            fake_value = random.choice(insurance_names)

        # GENERIC FALLBACK
        else:
            safe_label = re.sub(r'[^A-Z0-9_]', '_', label.upper().replace(' ', '_'))
            fake_value = f"[FAKE_{safe_label}]"

        # Cache and return
        self.replacement_cache[cache_key] = fake_value
        return fake_value

    def replace_pii_json(self, pii_json: Dict[str, Union[str, List[str]]]) -> Dict[str, Union[str, List[str]]]:
        """
        Replace detected PII values with synthetic ones.
        Ensures patient name processed first to allow email consistency.
        """
        self.current_patient_name = None
        fake_json: Dict[str, Union[str, List[str]]] = {}

        # First pass: try to find patient name
        for label, value in pii_json.items():
            label_lower = label.lower()
            if 'patient name' in label_lower or label_lower == 'name':
                if isinstance(value, list):
                    fake_json[label] = [self.generate_fake_value(label, v) for v in value]
                else:
                    fake_json[label] = self.generate_fake_value(label, value)

                # Set current patient name for email generation
                if isinstance(fake_json[label], str):
                    self.current_patient_name = fake_json[label]
                elif isinstance(fake_json[label], list) and len(fake_json[label]) > 0:
                    self.current_patient_name = fake_json[label][0]
                break

        # Process remaining keys
        for label, value in pii_json.items():
            label_lower = label.lower()

            # Skip already processed patient name
            if ('patient name' in label_lower or label_lower == 'name') and label in fake_json:
                continue

            if isinstance(value, list):
                fake_json[label] = [self.generate_fake_value(label, v) for v in value]
            else:
                fake_json[label] = self.generate_fake_value(label, value)

        return fake_json

    def save_fake_json(self, fake_data: Dict, output_file: str = "fake_pii_output.json") -> str:
        """Save fake data to JSON file"""
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(fake_data, f, indent=2, ensure_ascii=False)
        return output_file

    def get_comparison_dict(self, original: Dict, fake: Dict) -> Dict:
        """Return comparison between original and fake data"""
        comparison = {}
        for label in original:
            orig = original[label]
            f = fake.get(label)
            comparison[label] = {"original": orig, "fake": f}
        return comparison

def process(input_file: str):
    """
    End-to-end pipeline:
    1. Detect PII using CleanPIIDetector
    2. Replace values with synthetic ones using SimplePIIFaker
    3. Return results
    """
    print(f"📄 Running PII Detector + Faker pipeline on: {input_file}")

    detector = CleanPIIDetector()
    detected_pii = detector.extract_pii_from_file(input_file)

    if "error" in detected_pii:
        print("❌ Error during detection:", detected_pii["error"])
        return {"error": detected_pii["error"]}

    faker = SimplePIIFaker()
    fake_pii = faker.replace_pii_json(detected_pii)

    print("\n🎭 Fake PII JSON:")
    print(json.dumps(fake_pii, indent=2, ensure_ascii=False))

    return {
        "success": True,
        "fake_pii": fake_pii,
        "input_file": input_file
    }

if __name__ == "__main__":
    # Demo
    input_file = "sample1.pdf"
    result = process(input_file)

    if result.get("success"):
        print("\n✅ Processing successful!")
        print(f"Generated fake data for {len(result['fake_pii'])} PII types")
    else:
        print("\n❌ Processing failed:", result.get("error"))