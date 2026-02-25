# 🔒 PII De-Identification System

A comprehensive **PII (Personally Identifiable Information) De-Identification System** that detects sensitive information (names, phone numbers, emails, addresses, etc.) from uploaded text or files and replaces them with synthetic values to protect user privacy.

## 🚀 Features

- **Smart PII Detection**: Identifies common PII entities including names, emails, phone numbers, addresses, SSNs, credit cards, IP addresses, and more
- **Synthetic Data Generation**: Replaces detected PII with realistic but fake placeholders using Faker library
- **Multiple Input Formats**: Support for plain text, CSV, and Excel files (.xlsx, .xls)
- **RESTful API**: Clean API endpoints for programmatic integration
- **Web Interface**: User-friendly frontend for testing and demonstration
- **Batch Processing**: Process entire datasets while maintaining data structure
- **Consistent Replacements**: Same PII values get replaced consistently within a session

## 📂 Project Structure

```
pii-system/
├── app.py                  # FastAPI backend server
├── server.js              # Node.js frontend server
├── pii_detector.py         # Core PII detection logic
├── replacer.py            # Synthetic data generation
├── requirements.txt       # Python dependencies
├── package.json          # Node.js dependencies
├── static/               # Frontend assets (CSS, JS)
├── templates/            # HTML templates
└── README.md            # This file
```

## ⚙️ Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- npm or yarn

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/pii-system.git
cd pii-system
```

### 2️⃣ Setup Backend (FastAPI)
```bash
# Create and activate virtual environment
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt

# Start the FastAPI server
uvicorn app:app --reload
```
👉 **Backend runs on:** http://localhost:8000

### 3️⃣ Setup Frontend (Node.js)
```bash
# Install Node.js dependencies
npm install

# Start the frontend server
node server.js
```
👉 **Frontend runs on:** http://localhost:3000

## 🔑 API Endpoints

### 1. Text De-identification
**POST** `/deidentify`

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

### 2. File Upload
**POST** `/upload`

Upload CSV or Excel files for bulk PII processing.

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

Returns system health status.

## 🖥️ Using the Web Interface

1. Open your browser and navigate to http://localhost:3000
2. **Text Processing**: Paste text in the input field and click "De-identify Text"
3. **File Upload**: Choose a CSV or Excel file and click "Upload & Process"
4. **View Results**: See original vs. de-identified data side by side
5. **Download**: Get processed files with PII removed

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
- **FastAPI**: Modern web framework for building APIs
- **Pandas**: Data manipulation and analysis
- **Faker**: Generate fake but realistic data
- **Uvicorn**: ASGI server implementation
- **OpenPyXL**: Excel file processing

### Frontend (Node.js)
- **Express**: Web application framework
- **Multer**: File upload handling
- **Axios**: HTTP client for API calls
- **EJS**: Template engine

## 🔧 Configuration

### Environment Variables
```bash
# Backend
BACKEND_PORT=8000
BACKEND_HOST=localhost

# Frontend
FRONTEND_PORT=3000
API_BASE_URL=http://localhost:8000
```

### Customization Options
- **Locale Settings**: Change Faker locale in `replacer.py`
- **Detection Patterns**: Modify regex patterns in `pii_detector.py`
- **Replacement Strategies**: Customize synthetic data generation
- **File Size Limits**: Adjust upload limits in `server.js`

## 📊 API Documentation

FastAPI provides interactive API documentation:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🧪 Testing

### Test the API directly:
```bash
# Test text de-identification
curl -X POST "http://localhost:8000/deidentify" \
     -H "Content-Type: application/json" \
     -d '{"text": "Contact John Doe at john@email.com"}'

# Health check
curl http://localhost:8000/health
```

### Sample Test Data:
```text
Employee Record:
Name: Sarah Johnson
Email: sarah.johnson@company.com
Phone: (555) 234-5678
SSN: 123-45-6789
Address: 456 Oak Avenue, Springfield, IL 62701
```

