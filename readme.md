# 🔒 PII De-Identification System

A comprehensive **PII (Personally Identifiable Information) De-Identification System** that detects sensitive information (names, phone numbers, emails, addresses, etc.) from uploaded text or files and replaces them with synthetic data while maintaining data integrity.

## 🚀 Features

- **Smart PII Detection**: Identifies common PII entities including names, emails, phone numbers, addresses, SSNs, credit cards, IP addresses, and more
- **Synthetic Data Generation**: Replaces detected PII with realistic but fake placeholders using Faker library
- **Multiple Input Formats**: Support for plain text, CSV, and Excel files (.xlsx, .xls)
- **RESTful API**: Clean, scalable API endpoints for seamless integration
- **Web Interface**: Intuitive interface for data processing and visualization
- **Batch Processing**: Process large datasets efficiently while maintaining data structure
- **Consistent Replacements**: Same PII values get replaced consistently within processing sessions

## 📂 Project Structure

```
deIdentifier/
├── app.py                  # FastAPI backend application
├── server.js              # Frontend application server
├── pii_detector.py         # Core PII detection logic
├── replacer.py            # Synthetic data generation engine
├── requirements.txt       # Python dependencies
├── package.json          # Node.js dependencies
├── static/               # Frontend assets (CSS, JS)
├── templates/            # HTML templates
└── README.md            # This file
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8 or higher
- Node.js 16 or higher
- npm or yarn package manager

### Installation & Deployment

#### Backend Setup (FastAPI)
```bash
# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app:app --host 0.0.0.0 --port 8000
```

#### Frontend Setup (Node.js)
```bash
# Install Node.js dependencies
npm install

# Start the frontend server
node server.js
```

The system is now ready to accept requests from any client or service.

## 🔑 API Endpoints

### 1. Text De-identification
**POST** `/deidentify`

Process text to detect and replace PII entities.

**Request Body:**
```json
{
  "text": "My name is John Doe and my email is john@example.com. Call me at 555-123-4567."
}
```

**Response:**
```json
{
  "original": "My name is John Doe and my email is john@example.com. Call me at 555-123-4567.",
  "deidentified": "My name is Michael Smith and my email is user123@domain.com. Call me at 555-987-6543.",
  "entities_found": {
    "name": ["John Doe"],
    "email": ["john@example.com"],
    "phone": ["770-123-4567"]
  }
}
```

### 2. File Processing
**POST** `/upload`

Process CSV or Excel files for bulk PII de-identification.

**Response:**
```json
{
  "filename": "data.csv",
  "original_rows": 100,
  "processed_rows": 100,
  "entities_found": {
    "email": 45,
    "phone": 32,
    "name": 67
  },
  "processed_data": "processed_csv_content..."
}
```

### 3. Health Check
**GET** `/health`

Verify system status and availability.

## 🖥️ Web Interface

The web interface provides:
1. **Text Processing**: Submit text for immediate de-identification
2. **File Upload**: Process CSV and Excel datasets
3. **Results Visualization**: View original vs. de-identified data
4. **Data Export**: Download processed files in original format

## 🛡️ PII Types Detected

| PII Type | Examples | Detection Method |
|----------|----------|------------------|
| **Names** | John Doe, Jane Smith | Pattern matching + heuristics |
| **Email Addresses** | user@domain.com | Regex patterns |
| **Phone Numbers** |  +91-770-123-4567 | Multiple format regex |
| **Social Security Numbers** | 123-45-6789, 123456789 | Format-specific regex |
| **Credit Card Numbers** | 4111-1111-1111-1111 | Luhn algorithm validation |
| **IP Addresses** | 192.168.1.1 | IPv4 pattern matching |
| **URLs** | https://example.com | URL pattern detection |
| **Addresses** | 123 Main Street | Street address patterns |
| **ZIP Codes** | 12345, 12345-6789 | Postal code formats |
| **Dates** | 01/01/2023, 2023-01-01 | Multiple date formats |

## 📦 Dependencies

### Backend (Python)
- **FastAPI**: High-performance web framework
- **Pandas**: Data processing and analysis
- **Faker**: Realistic synthetic data generation
- **Uvicorn**: ASGI application server
- **OpenPyXL**: Excel file handling

### Frontend (Node.js)
- **Express**: Web application framework
- **Multer**: File upload management
- **Axios**: HTTP client
- **EJS**: Template rendering

## 🔧 Configuration

### Environment Variables
```bash
# Backend
BACKEND_PORT=8000
BACKEND_HOST=0.0.0.0

# Frontend
FRONTEND_PORT=3000
API_BASE_URL=https://your-api-endpoint
```

### Customization
- **Locale Settings**: Configure Faker locale in `replacer.py`
- **Detection Patterns**: Customize regex patterns in `pii_detector.py`
- **Replacement Strategies**: Modify synthetic data generation logic
- **Upload Limits**: Adjust file size constraints in `server.js`

## 📊 API Documentation

Interactive API documentation is available at:
- **Swagger UI**: `/docs` endpoint
- **ReDoc**: `/redoc` endpoint

## 🧪 Testing

### API Integration Example
```bash
# De-identify text
curl -X POST "https://your-api-endpoint/deidentify" \
     -H "Content-Type: application/json" \
     -d '{"text": "Contact John Doe at john@email.com"}'

# Health check
curl https://your-api-endpoint/health
```

### Sample Data
```text
Employee Record:
Name: Sarah Johnson
Email: sarah.johnson@company.com
Phone: (555) 234-5678
SSN: 123-45-6789
Address: 456 Oak Avenue, Springfield, IL 62701
```

## 📋 Use Cases

- **Healthcare Systems**: De-identify patient records for research
- **Financial Services**: Secure sensitive customer data
- **Data Analytics**: Prepare datasets for analysis without exposing PII
- **Compliance**: Meet GDPR, HIPAA, and other privacy regulations
- **Data Sharing**: Safely share datasets with third parties

## 📄 License

See LICENSE file for details.

## 🤝 Contributing

Contributions are welcome. Please submit pull requests or open issues for bugs and feature requests.
