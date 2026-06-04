"""
database.py
-----------
SQLite database setup, table creation, and helper functions.
Seeds a default admin user on first run.
"""

import sqlite3
import os
from datetime import datetime
from werkzeug.security import generate_password_hash

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "resume_analyzer.db")


def get_connection():
    """Get a new SQLite connection with row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables and seed default admin user."""
    conn = get_connection()
    cursor = conn.cursor()

    # ── Users table ──
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # ── Analyses table ──
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS analyses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            candidate_name TEXT,
            candidate_email TEXT,
            candidate_phone TEXT,
            selected_role TEXT,
            ats_score REAL,
            job_match_percentage REAL,
            detected_skills TEXT,
            matched_skills TEXT,
            missing_skills TEXT,
            languages_known TEXT,
            formatting_suggestions TEXT,
            spelling_suggestions TEXT,
            final_suggestions TEXT,
            education_found INTEGER DEFAULT 0,
            projects_found INTEGER DEFAULT 0,
            experience_found INTEGER DEFAULT 0,
            certifications_found INTEGER DEFAULT 0,
            score_breakdown TEXT,
            report_path TEXT,
            raw_text TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )
    """)

    # ── Migration: Add raw_text column if it doesn't exist ──
    try:
        cursor.execute("ALTER TABLE analyses ADD COLUMN raw_text TEXT")
    except sqlite3.OperationalError:
        pass # Column already exists

    # ── Seed default admin user ──
    cursor.execute("SELECT id FROM users WHERE email = ?", ("admin@resumeanalyzer.com",))
    if not cursor.fetchone():
        cursor.execute(
            "INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)",
            (
                "Admin",
                "admin@resumeanalyzer.com",
                generate_password_hash("admin123"),
                "admin",
            ),
        )

    conn.commit()
    conn.close()


# ─────────────────────── User helpers ───────────────────────

def create_user(name: str, email: str, password_hash: str):
    """Insert a new user and return their id."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
        (name, email, password_hash),
    )
    conn.commit()
    user_id = cursor.lastrowid
    conn.close()
    return user_id


def get_user_by_email(email: str):
    """Return user row by email or None."""
    conn = get_connection()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    return user


def get_user_by_id(user_id: int):
    """Return user row by id or None."""
    conn = get_connection()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return user


def get_all_users():
    """Return all users (admin helper)."""
    conn = get_connection()
    users = conn.execute(
        "SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    return [dict(u) for u in users]


# ─────────────────────── Analysis helpers ───────────────────────

def save_analysis(data: dict):
    """Insert an analysis record and return its id."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        """INSERT INTO analyses
           (user_id, candidate_name, candidate_email, candidate_phone,
            selected_role, ats_score, job_match_percentage,
            detected_skills, matched_skills, missing_skills,
            languages_known, formatting_suggestions, spelling_suggestions,
            final_suggestions, education_found, projects_found,
            experience_found, certifications_found, score_breakdown, report_path, raw_text)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (
            data["user_id"],
            data.get("candidate_name", ""),
            data.get("candidate_email", ""),
            data.get("candidate_phone", ""),
            data.get("selected_role", ""),
            data.get("ats_score", 0),
            data.get("job_match_percentage", 0),
            data.get("detected_skills", ""),
            data.get("matched_skills", ""),
            data.get("missing_skills", ""),
            data.get("languages_known", ""),
            data.get("formatting_suggestions", ""),
            data.get("spelling_suggestions", ""),
            data.get("final_suggestions", ""),
            data.get("education_found", 0),
            data.get("projects_found", 0),
            data.get("experience_found", 0),
            data.get("certifications_found", 0),
            data.get("score_breakdown", ""),
            data.get("report_path", ""),
            data.get("raw_text", ""),
        ),
    )
    conn.commit()
    analysis_id = cursor.lastrowid
    conn.close()
    return analysis_id


def update_analysis_report_path(analysis_id: int, report_path: str):
    """Update the report_path for an existing analysis."""
    conn = get_connection()
    conn.execute(
        "UPDATE analyses SET report_path = ? WHERE id = ?", (report_path, analysis_id)
    )
    conn.commit()
    conn.close()


def append_raw_text(analysis_id: int, new_text: str):
    """Append new text to the raw_text of an existing analysis."""
    conn = get_connection()
    row = conn.execute("SELECT raw_text FROM analyses WHERE id = ?", (analysis_id,)).fetchone()
    if row:
        current_text = row["raw_text"] or ""
        updated_text = current_text + "\n" + new_text
        conn.execute("UPDATE analyses SET raw_text = ? WHERE id = ?", (updated_text, analysis_id))
        conn.commit()
    conn.close()


def get_analyses_by_user(user_id: int):
    """Return all analyses for a user, newest first."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM analyses WHERE user_id = ? ORDER BY created_at DESC",
        (user_id,),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

def delete_analysis_by_id(analysis_id: int):
    """Delete a single analysis by id."""
    conn = get_connection()
    conn.execute("DELETE FROM analyses WHERE id = ?", (analysis_id,))
    conn.commit()
    conn.close()


def get_analysis_by_id(analysis_id: int):
    """Return a single analysis by id."""
    conn = get_connection()
    row = conn.execute("SELECT * FROM analyses WHERE id = ?", (analysis_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_all_analyses():
    """Return all analyses (admin helper)."""
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM analyses ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_stats():
    """Return aggregate statistics for admin dashboard."""
    conn = get_connection()
    total_users = conn.execute("SELECT COUNT(*) as c FROM users WHERE role='user'").fetchone()["c"]
    total_analyses = conn.execute("SELECT COUNT(*) as c FROM analyses").fetchone()["c"]
    avg_ats = conn.execute("SELECT COALESCE(AVG(ats_score), 0) as a FROM analyses").fetchone()["a"]

    # Most selected job roles
    role_rows = conn.execute(
        "SELECT selected_role, COUNT(*) as cnt FROM analyses GROUP BY selected_role ORDER BY cnt DESC LIMIT 10"
    ).fetchall()
    top_roles = [{"role": r["selected_role"], "count": r["cnt"]} for r in role_rows]

    conn.close()
    return {
        "total_users": total_users,
        "total_analyses": total_analyses,
        "average_ats_score": round(avg_ats, 1),
        "top_roles": top_roles,
    }
