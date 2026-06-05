"""
app.py
------
Flask REST API for AI Resume Analyzer.
Handles user auth, resume upload/analysis, report download, history, and admin panel.
"""

import os
import json
import jwt
import datetime
from functools import wraps

from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename

from database import (
    init_db, get_connection,
    create_user, get_user_by_email, get_user_by_id,
    get_all_users, save_analysis, update_analysis_report_path,
    get_analyses_by_user, get_analysis_by_id, get_all_analyses, get_stats,
    delete_analysis_by_id, append_raw_text
)
from analyzer import analyze_resume, JOB_ROLES
from report_generator import generate_report
from resume_builder import generate_corrected_resume

# ═══════════════════════════════════════════════════════════════
#  APP CONFIGURATION
# ═══════════════════════════════════════════════════════════════

app = Flask(__name__)

# CORS headers for Vercel frontend → Render backend
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = jsonify({"status": "ok"})
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        return response, 200


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    return response

app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "ai-resume-analyzer-secret-key-2024")
app.config["MAX_CONTENT_LENGTH"] = 5 * 1024 * 1024  # 5 MB max upload

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
REPORTS_FOLDER = os.path.join(BASE_DIR, "reports")
ALLOWED_EXTENSIONS = {"pdf", "docx"}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(REPORTS_FOLDER, exist_ok=True)

# Initialize database on startup
init_db()


# ═══════════════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════════════

def allowed_file(filename: str) -> bool:
    """Check if the uploaded file has an allowed extension."""
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


def create_token(user_id: int, role: str) -> str:
    """Create a JWT token for the user."""
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24),
    }
    return jwt.encode(payload, app.config["SECRET_KEY"], algorithm="HS256")


def token_required(f):
    """Decorator to require a valid JWT token for protected routes."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"error": "Authentication token is missing."}), 401

        try:
            payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            current_user = get_user_by_id(payload["user_id"])
            if not current_user:
                return jsonify({"error": "User not found."}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token."}), 401

        return f(current_user, *args, **kwargs)
    return decorated


def admin_required(f):
    """Decorator to require admin role."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"error": "Authentication token is missing."}), 401

        try:
            payload = jwt.decode(token, app.config["SECRET_KEY"], algorithms=["HS256"])
            current_user = get_user_by_id(payload["user_id"])
            if not current_user:
                return jsonify({"error": "User not found."}), 401
            if current_user["role"] != "admin":
                return jsonify({"error": "Admin access required."}), 403
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token."}), 401

        return f(current_user, *args, **kwargs)
    return decorated


# ═══════════════════════════════════════════════════════════════
#  AUTH ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.route("/api/signup", methods=["POST", "OPTIONS"])
@app.route("/signup", methods=["POST", "OPTIONS"])
def signup():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True) or {}

    name = data.get("name", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not name or not email or not password:
        return jsonify({"error": "Name, email, and password are required."}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    if get_user_by_email(email):
        return jsonify({"error": "Email is already registered."}), 409

    password_hash = generate_password_hash(password)
    user_id = create_user(name, email, password_hash)
    token = create_token(user_id, "user")

    return jsonify({
        "message": "Account created successfully.",
        "token": token,
        "user": {
            "id": user_id,
            "name": name,
            "email": email,
            "role": "user"
        },
    }), 201


@app.route("/api/login", methods=["POST", "OPTIONS"])
@app.route("/login", methods=["POST", "OPTIONS"])
def login():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(silent=True) or {}

    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = get_user_by_email(email)
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid email or password."}), 401

    token = create_token(user["id"], user["role"])

    return jsonify({
        "message": "Login successful.",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        },
    }), 200


# ═══════════════════════════════════════════════════════════════
#  RESUME UPLOAD & ANALYSIS
# ═══════════════════════════════════════════════════════════════

@app.route("/api/upload-resume", methods=["POST"])
@token_required
def upload_resume(current_user):
    """Upload a resume file, analyze it, generate report, and return results."""
    # Validate file
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded."}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "No file selected."}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file type. Only PDF and DOCX files are accepted."}), 400

    # Validate job role
    selected_role = request.form.get("role", "").strip()
    if not selected_role or selected_role not in JOB_ROLES:
        return jsonify({"error": "Please select a valid job role."}), 400

    # Save file temporarily
    filename = secure_filename(file.filename)
    # Add timestamp to avoid collisions
    timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
    filename = f"{timestamp}_{filename}"
    filepath = os.path.join(UPLOAD_FOLDER, filename)
    file.save(filepath)

    try:
        # Run analysis
        result = analyze_resume(filepath, selected_role)

        if "error" in result:
            return jsonify({"error": result["error"]}), 400

        # Save analysis to database
        analysis_data = {
            "user_id": current_user["id"],
            "candidate_name": result["candidate_name"],
            "candidate_email": result["candidate_email"],
            "candidate_phone": result["candidate_phone"],
            "selected_role": selected_role,
            "ats_score": result["ats_score"],
            "job_match_percentage": result["job_match_percentage"],
            "detected_skills": json.dumps(result["detected_skills"]),
            "matched_skills": json.dumps(result["matched_skills"]),
            "missing_skills": json.dumps(result["missing_skills"]),
            "languages_known": json.dumps(result["languages_known"]),
            "formatting_suggestions": json.dumps(result["formatting_suggestions"]),
            "spelling_suggestions": json.dumps(result["spelling_suggestions"]),
            "final_suggestions": json.dumps(result["final_suggestions"]),
            "education_found": 1 if result["education_found"] else 0,
            "projects_found": 1 if result["projects_found"] else 0,
            "experience_found": 1 if result["experience_found"] else 0,
            "certifications_found": 1 if result["certifications_found"] else 0,
            "score_breakdown": json.dumps(result["score_breakdown"]),
            "report_path": "",
            "raw_text": result.get("raw_text", ""),
        }
        analysis_id = save_analysis(analysis_data)

        # Generate PDF report
        report_data = {**analysis_data, "ats_score": result["ats_score"]}
        report_path = generate_report(report_data, REPORTS_FOLDER, analysis_id)
        update_analysis_report_path(analysis_id, report_path)

        # Return full result
        return jsonify({
            "message": "Analysis completed successfully.",
            "analysis_id": analysis_id,
            "result": {
                **result,
                "analysis_id": analysis_id,
            },
        }), 200

    except Exception as e:
        return jsonify({"error": f"Analysis failed: {str(e)}"}), 500

    finally:
        # Clean up uploaded file
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except Exception:
                pass


@app.route("/api/analyze", methods=["POST"])
@token_required
def re_analyze(current_user):
    """Re-analyze an existing resume text with a different role (not re-uploading)."""
    data = request.get_json()
    analysis_id = data.get("analysis_id")
    new_role = data.get("role", "").strip()

    if not analysis_id or not new_role:
        return jsonify({"error": "analysis_id and role are required."}), 400

    if new_role not in JOB_ROLES:
        return jsonify({"error": "Invalid job role."}), 400

    # For re-analysis we just return updated skill comparison
    # (the original file is deleted, so we use stored data)
    existing = get_analysis_by_id(analysis_id)
    if not existing:
        return jsonify({"error": "Analysis not found."}), 404

    return jsonify({
        "message": "Please upload the resume again to analyze with a different role.",
    }), 200


# ═══════════════════════════════════════════════════════════════
#  HISTORY & RESULTS
# ═══════════════════════════════════════════════════════════════

@app.route("/api/append-resume-info/<int:analysis_id>", methods=["POST"])
@token_required
def append_resume_info(current_user, analysis_id):
    """Append text to the raw_text of an existing resume."""
    analysis = get_analysis_by_id(analysis_id)
    if not analysis:
        return jsonify({"error": "Analysis not found."}), 404

    if analysis["user_id"] != current_user["id"] and current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized."}), 403

    data = request.get_json()
    new_text = data.get("text", "").strip()
    if not new_text:
        return jsonify({"error": "No text provided to append."}), 400

    append_raw_text(analysis_id, new_text)

    return jsonify({"message": "Information added to resume successfully."}), 200


@app.route("/api/history/<int:user_id>", methods=["GET"])
@token_required
def get_history(current_user, user_id):
    """Get analysis history for a user."""
    if current_user["id"] != user_id and current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized."}), 403

    analyses = get_analyses_by_user(user_id)
    return jsonify({"analyses": analyses}), 200


@app.route("/api/result/<int:analysis_id>", methods=["GET"])
@token_required
def get_result(current_user, analysis_id):
    """Get a single analysis result."""
    analysis = get_analysis_by_id(analysis_id)
    if not analysis:
        return jsonify({"error": "Analysis not found."}), 404

    if analysis["user_id"] != current_user["id"] and current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized."}), 403

    # Parse JSON strings back to lists/dicts for the response
    for field in ["detected_skills", "matched_skills", "missing_skills",
                  "languages_known", "formatting_suggestions",
                  "spelling_suggestions", "final_suggestions", "score_breakdown"]:
        if isinstance(analysis.get(field), str):
            try:
                analysis[field] = json.loads(analysis[field])
            except (json.JSONDecodeError, TypeError):
                pass

    return jsonify({"analysis": analysis}), 200

@app.route("/api/analysis/<int:analysis_id>", methods=["DELETE"])
@token_required
def delete_analysis(current_user, analysis_id):
    """Delete a single analysis result."""
    analysis = get_analysis_by_id(analysis_id)
    if not analysis:
        return jsonify({"error": "Analysis not found."}), 404

    if analysis["user_id"] != current_user["id"] and current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized."}), 403

    # Try to delete the PDF report file if it exists
    report_path = analysis.get("report_path", "")
    if report_path and os.path.exists(report_path):
        try:
            os.remove(report_path)
        except Exception:
            pass

    delete_analysis_by_id(analysis_id)
    return jsonify({"message": "Analysis deleted successfully."}), 200


@app.route("/api/download-report/<int:analysis_id>", methods=["GET"])
@token_required
def download_report(current_user, analysis_id):
    """Download the PDF report for an analysis."""
    analysis = get_analysis_by_id(analysis_id)
    if not analysis:
        return jsonify({"error": "Analysis not found."}), 404

    if analysis["user_id"] != current_user["id"] and current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized."}), 403

    report_path = analysis.get("report_path", "")
    if not report_path or not os.path.exists(report_path):
        # Try to regenerate the report
        try:
            report_path = generate_report(analysis, REPORTS_FOLDER, analysis_id)
            update_analysis_report_path(analysis_id, report_path)
        except Exception:
            return jsonify({"error": "Report file not found and could not be regenerated."}), 404

    return send_file(
        report_path,
        as_attachment=True,
        download_name=f"resume_analysis_{analysis_id}.pdf",
        mimetype="application/pdf",
    )


@app.route("/api/download-corrected-resume/<int:analysis_id>", methods=["GET"])
@token_required
def download_corrected_resume(current_user, analysis_id):
    """Download the corrected ATS-friendly DOCX resume."""
    analysis = get_analysis_by_id(analysis_id)
    if not analysis:
        return jsonify({"error": "Analysis not found."}), 404

    if analysis["user_id"] != current_user["id"] and current_user["role"] != "admin":
        return jsonify({"error": "Unauthorized."}), 403

    try:
        # Generate on the fly
        docx_path = generate_corrected_resume(analysis, REPORTS_FOLDER, analysis_id)
        
        return send_file(
            docx_path,
            as_attachment=True,
            download_name=f"ATS_Template_{analysis_id}.docx",
            mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )
    except Exception as e:
        return jsonify({"error": f"Failed to generate corrected resume: {str(e)}"}), 500


# ═══════════════════════════════════════════════════════════════
#  JOB ROLES LIST

# ═══════════════════════════════════════════════════════════════

@app.route("/api/roles", methods=["GET"])
def get_roles():
    """Return list of available job roles."""
    return jsonify({"roles": list(JOB_ROLES.keys())}), 200


# ═══════════════════════════════════════════════════════════════
#  ADMIN ENDPOINTS
# ═══════════════════════════════════════════════════════════════

@app.route("/api/admin/login", methods=["POST"])
def admin_login():
    """Admin login endpoint."""
    data = request.get_json()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required."}), 400

    user = get_user_by_email(email)
    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify({"error": "Invalid credentials."}), 401

    if user["role"] != "admin":
        return jsonify({"error": "Admin access denied."}), 403

    token = create_token(user["id"], "admin")
    return jsonify({
        "message": "Admin login successful.",
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
        },
    }), 200


@app.route("/api/admin/users", methods=["GET"])
@admin_required
def admin_users(current_user):
    """Get all registered users (admin only)."""
    users = get_all_users()
    return jsonify({"users": users}), 200


@app.route("/api/admin/analyses", methods=["GET"])
@admin_required
def admin_analyses(current_user):
    """Get all analyses (admin only)."""
    analyses = get_all_analyses()
    # Parse JSON fields
    for a in analyses:
        for field in ["detected_skills", "matched_skills", "missing_skills",
                      "languages_known", "formatting_suggestions",
                      "spelling_suggestions", "final_suggestions", "score_breakdown"]:
            if isinstance(a.get(field), str):
                try:
                    a[field] = json.loads(a[field])
                except (json.JSONDecodeError, TypeError):
                    pass
    return jsonify({"analyses": analyses}), 200


@app.route("/api/admin/stats", methods=["GET"])
@admin_required
def admin_stats(current_user):
    """Get aggregate statistics (admin only)."""
    stats = get_stats()
    return jsonify({"stats": stats}), 200


# ═══════════════════════════════════════════════════════════════
#  ERROR HANDLERS
# ═══════════════════════════════════════════════════════════════

@app.errorhandler(413)
def file_too_large(e):
    return jsonify({"error": "File size exceeds the 5MB limit."}), 413


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": "Endpoint not found."}), 404


@app.errorhandler(500)
def internal_error(e):
    return jsonify({"error": "Internal server error."}), 500


# ═══════════════════════════════════════════════════════════════
#  RUN
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_ENV") == "development"
    print("\n=== AI Resume Analyzer Backend ===")
    print(f"Server running at http://{host}:{port}")
    print("Admin: admin@resumeanalyzer.com / admin123\n")
    app.run(debug=debug_mode, host=host, port=port)
