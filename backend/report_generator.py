"""
report_generator.py
-------------------
Generate a professional PDF report of the resume analysis using FPDF.
"""

import os
import json
from fpdf import FPDF

def sanitize_text(text: str) -> str:
    """Sanitize text to be compatible with FPDF's default latin-1 fonts."""
    if not isinstance(text, str):
        text = str(text)
    return text.encode('latin-1', 'replace').decode('latin-1')


class ResumeReport(FPDF):
    """Custom FPDF subclass with header/footer for the analysis report."""

    def header(self):
        self.set_font("Helvetica", "B", 16)
        self.set_text_color(44, 62, 80)
        self.cell(0, 10, "AI Resume Analyzer - Analysis Report", ln=True, align="C")
        self.set_draw_color(52, 152, 219)
        self.set_line_width(0.5)
        self.line(10, 22, 200, 22)
        self.ln(8)

    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}}", align="C")

    def section_title(self, title: str):
        self.set_font("Helvetica", "B", 13)
        self.set_text_color(41, 128, 185)
        self.cell(0, 9, sanitize_text(title), ln=True)
        self.set_draw_color(41, 128, 185)
        self.set_line_width(0.3)
        self.line(10, self.get_y(), 200, self.get_y())
        self.ln(3)

    def field_row(self, label: str, value: str):
        self.set_font("Helvetica", "B", 10)
        self.set_text_color(44, 62, 80)
        self.cell(50, 7, f"{sanitize_text(label)}:", align="L")
        self.set_font("Helvetica", "", 10)
        self.set_text_color(60, 60, 60)
        
        safe_value = sanitize_text(value)
        # Handle long values with multi_cell
        if len(safe_value) > 80:
            self.ln()
            self.set_x(15)
            self.multi_cell(180, 6, safe_value)
        else:
            self.cell(0, 7, safe_value, ln=True)

    def bullet_list(self, items: list):
        self.set_font("Helvetica", "", 10)
        self.set_text_color(60, 60, 60)
        for item in items:
            self.set_x(15)
            self.multi_cell(180, 6, f"  *  {sanitize_text(item)}")
            self.ln(1)


def generate_report(analysis_data: dict, output_dir: str, analysis_id: int) -> str:
    """
    Generate a PDF report and return the file path.

    Args:
        analysis_data: dict with all analysis results
        output_dir: directory to save the report
        analysis_id: unique analysis id for filename

    Returns:
        Absolute path to the generated PDF file.
    """
    os.makedirs(output_dir, exist_ok=True)
    filename = f"report_{analysis_id}.pdf"
    filepath = os.path.join(output_dir, filename)

    pdf = ResumeReport()
    pdf.alias_nb_pages()
    pdf.set_auto_page_break(auto=True, margin=20)
    pdf.add_page()

    # ── Candidate Info ──
    pdf.section_title("Candidate Information")
    pdf.field_row("Name", analysis_data.get("candidate_name", "N/A"))
    pdf.field_row("Email", analysis_data.get("candidate_email", "N/A"))
    pdf.field_row("Phone", analysis_data.get("candidate_phone", "N/A"))
    pdf.field_row("Selected Role", analysis_data.get("selected_role", "N/A"))
    pdf.ln(4)

    # ── ATS Score ──
    pdf.section_title("ATS Score")
    ats = analysis_data.get("ats_score", 0)
    pdf.field_row("Total Score", f"{ats} / 100")
    pdf.ln(2)

    # Score breakdown
    breakdown = analysis_data.get("score_breakdown", {})
    if isinstance(breakdown, str):
        try:
            breakdown = json.loads(breakdown)
        except Exception:
            breakdown = {}

    if breakdown:
        pdf.set_font("Helvetica", "B", 10)
        pdf.set_text_color(44, 62, 80)
        pdf.cell(0, 7, "Section-wise Breakdown:", ln=True)
        pdf.set_font("Helvetica", "", 10)
        for section, vals in breakdown.items():
            if isinstance(vals, dict):
                pdf.set_x(15)
                safe_section = sanitize_text(section)
                pdf.cell(0, 6, f"  {safe_section}: {vals.get('score', 0)} / {vals.get('max', 0)}", ln=True)
    pdf.ln(4)

    # ── Job Match ──
    pdf.section_title("Job Match Analysis")
    pdf.field_row("Job Match", f"{analysis_data.get('job_match_percentage', 0)}%")
    pdf.ln(2)

    # Skills lists
    def _skill_list(data, key):
        val = data.get(key, [])
        if isinstance(val, str):
            try:
                val = json.loads(val)
            except Exception:
                val = [v.strip() for v in val.split(",") if v.strip()]
        return val

    detected = _skill_list(analysis_data, "detected_skills")
    matched = _skill_list(analysis_data, "matched_skills")
    missing = _skill_list(analysis_data, "missing_skills")

    pdf.field_row("Detected Skills", ", ".join(detected) if detected else "None")
    pdf.field_row("Matched Skills", ", ".join(matched) if matched else "None")
    pdf.field_row("Missing Skills", ", ".join(missing) if missing else "None")
    pdf.ln(4)

    # ── Languages ──
    pdf.section_title("Languages Known")
    langs = analysis_data.get("languages_known", [])
    if isinstance(langs, str):
        try:
            langs = json.loads(langs)
        except Exception:
            langs = [l.strip() for l in langs.split(",") if l.strip()]
    pdf.field_row("Languages", ", ".join(langs) if langs else "None detected")
    pdf.ln(4)

    # ── Section presence ──
    pdf.section_title("Resume Sections")
    pdf.field_row("Education", "Found" if analysis_data.get("education_found") else "Not Found")
    pdf.field_row("Experience", "Found" if analysis_data.get("experience_found") else "Not Found")
    pdf.field_row("Projects", "Found" if analysis_data.get("projects_found") else "Not Found")
    pdf.field_row("Certifications", "Found" if analysis_data.get("certifications_found") else "Not Found")
    pdf.ln(4)

    # ── Formatting Suggestions ──
    pdf.section_title("Formatting Suggestions")
    fmt = analysis_data.get("formatting_suggestions", [])
    if isinstance(fmt, str):
        try:
            fmt = json.loads(fmt)
        except Exception:
            fmt = [f.strip() for f in fmt.split(";") if f.strip()]
    if fmt:
        pdf.bullet_list(fmt)
    else:
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 7, "  No formatting issues detected.", ln=True)
    pdf.ln(2)

    # ── Spelling Suggestions ──
    pdf.section_title("Spelling Suggestions")
    spell = analysis_data.get("spelling_suggestions", [])
    if isinstance(spell, str):
        try:
            spell = json.loads(spell)
        except Exception:
            spell = [s.strip() for s in spell.split(";") if s.strip()]
    if spell:
        pdf.bullet_list(spell)
    else:
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 7, "  No spelling issues detected.", ln=True)
    pdf.ln(2)

    # ── Final Suggestions ──
    pdf.section_title("Improvement Suggestions")
    final = analysis_data.get("final_suggestions", [])
    if isinstance(final, str):
        try:
            final = json.loads(final)
        except Exception:
            final = [f.strip() for f in final.split(";") if f.strip()]
    if final:
        pdf.bullet_list(final)
    else:
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 7, "  Your resume looks great!", ln=True)

    pdf.output(filepath)
    return filepath
