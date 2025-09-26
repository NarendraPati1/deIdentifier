
# 🔒 PII De-Identification System

This project provides a **PII (Personally Identifiable Information) De-Identification System**.  
It detects sensitive information (like names, phone numbers, emails, etc.) from uploaded text or files  
and replaces them with synthetic values to protect user privacy.  

The system has two main components:  
1. **Backend (`app.py`)** – FastAPI server that detects and replaces PII.  
2. **Frontend (`server.js`)** – Node.js/Express server with UI to interact with the backend.  

---

## 🚀 Features
- Detects common PII entities (Name, Email, Phone Number, Address, etc.).  
- Replaces detected PII with synthetic but realistic placeholders.  
- Upload text or CSV/Excel files for processing.  
- REST API for programmatic use.  
- Simple frontend UI to test the system.  

---

## 📂 Project Structure
pii-system/
│── app.py # FastAPI backend for PII detection & replacement
│── server.js # Frontend server (Node.js + Express)
│── replacer.py # Utility for generating fake replacements
│── pii_detector.py # Core PII detection logic
│── requirements.txt # Python dependencies
│── package.json # Node.js dependencies
│── static/ # Frontend assets
│── templates/ # HTML templates

yaml
Copy code

---

## ⚙️ Setup Instructions

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/your-username/pii-system.git
cd pii-system
2️⃣ Setup Backend (FastAPI)
bash
Copy code
# Create virtual environment
python -m venv venv
source venv/bin/activate   # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run FastAPI server
uvicorn app:app --reload
👉 Backend runs on: http://localhost:8000

3️⃣ Setup Frontend (Node.js)
bash
Copy code
# Install dependencies
npm install

# Run frontend server
node server.js
👉 Frontend runs on: http://localhost:3000

🔑 API Endpoints
1. Detect & Replace PII
POST /deidentify

Request:

json
Copy code
{
  "text": "My name is John Doe and my email is john@example.com"
}
Response:

json
Copy code
{
  "original": "My name is John Doe and my email is john@example.com",
  "deidentified": "My name is Michael Smith and my email is user123@domain.com"
}
2. File Upload
POST /upload – Upload CSV/Excel files for PII removal.

🖥️ Demo
Open http://localhost:3000 in your browser.

Upload text or file to see PII de-identification in action.

📦 Dependencies
Backend: FastAPI, Pandas, Faker, Regex

Frontend: Node.js, Express

🔮 Future Improvements
Add support for PDFs and Word documents.

Enhance PII detection with NLP models.

Provide configurable anonymization strategies.

Dockerize for easy deployment.

📘 API Documentation
FastAPI provides interactive docs at:

Swagger UI → http://localhost:8000/docs

ReDoc → http://localhost:8000/redoc

👨‍💻 Author
Developed by Narendra 🚀
