# AI Resume Analyzer

A comprehensive full-stack web application that allows users to upload their resumes (PDF/DOCX), select a target job role, and receive an intelligent analysis including an ATS score, skill gap detection, formatting checks, and spelling suggestions.

## Features
- **User Authentication**: Secure signup and login system.
- **Resume Upload**: Support for PDF and DOCX formats.
- **Intelligent Analysis**:
  - Extracts contact information, education, experience, and projects.
  - Matches skills against 29+ predefined job roles.
  - Calculates an ATS (Applicant Tracking System) score out of 100 with section-wise breakdown.
  - Detects languages known.
- **Formatting & Spelling Check**: Detects font size issues (DOCX), missing sections, extra spaces, and common technical spelling mistakes using a custom dictionary fallback.
- **Detailed Report**: Generates a downloadable PDF report of the analysis.
- **Dashboard & History**: Tracks all past analyses for users.
- **Admin Panel**: Manage users and view platform-wide statistics.

## Tech Stack
- **Frontend**: React.js (Vite), React Router, Axios, Custom CSS (Modern UI)
- **Backend**: Python, Flask, SQLite (sqlite3)
- **Text Processing**: pdfplumber, python-docx, FPDF (for PDF generation)

## Folder Structure
```text
AI-Resume-Analyzer/
├── frontend/                  # React Frontend
│   ├── src/
│   │   ├── api.js             # Axios configuration
│   │   ├── components/        # Reusable UI components
│   │   ├── pages/             # Application pages
│   │   └── styles/            # CSS Design system
│   └── package.json
├── backend/                   # Flask Backend
│   ├── app.py                 # REST API Endpoints
│   ├── analyzer.py            # Core analysis logic
│   ├── database.py            # SQLite setup and queries
│   ├── report_generator.py    # FPDF report creation
│   ├── requirements.txt
│   ├── uploads/               # Temporary file storage
│   └── reports/               # Generated PDF reports
└── README.md
```

## Installation Steps

### 1. Backend Setup
1. Open a terminal and navigate to the backend folder:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment (Windows):
   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```
3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Flask server:
   ```bash
   python app.py
   ```
   The backend will run at `http://localhost:5000`.

### 2. Frontend Setup
1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install the Node.js dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   The frontend will run at the URL provided by Vite (usually `http://localhost:5173`).

## API Endpoints

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| POST | `/api/signup` | No | Register a new user |
| POST | `/api/login` | No | Authenticate and get JWT token |
| POST | `/api/upload-resume` | Yes | Upload and analyze a resume |
| POST | `/api/analyze` | Yes | Endpoint placeholder for re-analysis |
| GET | `/api/history/<user_id>`| Yes | Get user's analysis history |
| GET | `/api/result/<analysis_id>`| Yes | Get specific analysis result |
| GET | `/api/download-report/<id>`| Yes | Download PDF report |
| POST | `/api/admin/login` | No | Admin authentication |
| GET | `/api/admin/users` | Admin | List all registered users |
| GET | `/api/admin/analyses` | Admin | List all analyses platform-wide |
| GET | `/api/admin/stats` | Admin | Aggregate dashboard statistics |

## Admin Credentials
A default admin user is seeded on the first run of the backend.
- **Email**: admin@resumeanalyzer.com
- **Password**: admin123

## Future Scope
- **AI Integration**: Replace dictionary and regex matching with LLMs (e.g., OpenAI, Gemini) for deeper semantic understanding of resume text.
- **LinkedIn Parsing**: Add capability to scrape and analyze a user's LinkedIn profile directly.
- **Cover Letter Generation**: Automatically generate tailored cover letters based on the uploaded resume and selected job role.
- **Real-time Feedback**: Add a resume builder interface with real-time analysis as the user types.
